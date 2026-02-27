import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import { orderService } from '@/services/order.service';
import { Customer } from '@/types/customer.types';
import {
    User, Search, Plus, X, Trash2, ArrowLeft, Copy, Check,
    Send, DollarSign, Truck, Package, FileText, Percent,
} from 'lucide-react';
import { maskCPF, maskPhone, validatePhone } from '@/lib/validation';

// Helpers
const toCents = (v: string) => Number(v.replace(/\D/g, '')) / 100;
const fmtCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const maskCurrency = (raw: string) => {
    const num = Number(raw.replace(/\D/g, '')) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface FormulaItem { name: string; dosage: string; activeInput: string; actives: string[]; price: string; }
const emptyFormula = (): FormulaItem => ({ name: '', dosage: '', activeInput: '', actives: [], price: '' });

export default function NewLinkPage() {
    const navigate = useNavigate();

    // Customer
    const [mode, setMode] = useState<'search' | 'new' | 'none'>('search');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Customer[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', cpf: '', phone: '' });
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Values
    const [totalValue, setTotalValue] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
    const [shippingValue, setShippingValue] = useState('');
    const [shippingType, setShippingType] = useState<'FIXED' | 'FREE' | 'DYNAMIC'>('FIXED');

    // Items
    const [formulas, setFormulas] = useState<FormulaItem[]>([emptyFormula()]);

    // State
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<{ id: string; link: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Search with debounce
    useEffect(() => {
        if (mode !== 'search' || query.length < 2) { setResults([]); return; }
        const t = setTimeout(() => {
            customerService.list({ search: query, limit: 5 }).then((r) => { setResults(r.data); setShowDropdown(true); }).catch(() => { });
        }, 400);
        return () => clearTimeout(t);
    }, [query, mode]);

    // Outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selectCustomer = (c: Customer) => { setSelectedCustomer(c); setShowDropdown(false); setQuery(c.name); };

    // Formula handlers
    const updateFormula = (idx: number, field: keyof FormulaItem, value: string) => {
        setFormulas((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
    };
    const addActive = (idx: number) => {
        setFormulas((prev) => prev.map((f, i) => {
            if (i !== idx || !f.activeInput.trim()) return f;
            return { ...f, actives: [...f.actives, f.activeInput.trim()], activeInput: '' };
        }));
    };
    const removeActive = (idx: number, aIdx: number) => {
        setFormulas((prev) => prev.map((f, i) => i === idx ? { ...f, actives: f.actives.filter((_, j) => j !== aIdx) } : f));
    };

    // Totals
    const total = toCents(totalValue);
    const discount = discountType === 'PERCENTAGE' ? (total * toCents(discountValue)) / 100 : toCents(discountValue);
    const shipping = shippingType === 'FREE' ? 0 : toCents(shippingValue);
    const finalValue = Math.max(0, total - discount + shipping);

    const handleSubmit = async () => {
        if (total <= 0) { toast.error('Informe o valor total.'); return; }
        if (mode === 'search' && !selectedCustomer) { toast.error('Selecione um cliente.'); return; }
        if (mode === 'new') {
            if (!newCustomer.name) { toast.error('Informe o nome do cliente.'); return; }
            if (!validatePhone(newCustomer.phone)) { toast.error('Número de WhatsApp/Telefone inválido.'); return; }
        }
        // mode === 'none' → no customer needed, backend creates anonymous

        setSubmitting(true);
        try {
            const order = await orderService.create({
                customerId: mode === 'search' ? selectedCustomer!.id : undefined,
                newCustomer: mode === 'new' ? { name: newCustomer.name, phone: newCustomer.phone, email: newCustomer.email || undefined, cpf: newCustomer.cpf || undefined } : undefined,
                // When mode === 'none', both customerId and newCustomer are undefined → backend creates anonymous customer
                totalValue: total,
                discountValue: discount > 0 ? (discountType === 'PERCENTAGE' ? toCents(discountValue) : discount) : undefined,
                discountType: discount > 0 ? discountType : undefined,
                shippingValue: shipping,
                shippingType,
                items: formulas
                    .filter((f) => f.name)
                    .map((f) => ({
                        name: f.name,
                        dosage: f.dosage || undefined,
                        actives: f.actives.length > 0 ? f.actives : undefined,
                        price: toCents(f.price) || undefined
                    })),
            });
            const link = `${window.location.origin}/checkout/${order.id}`;
            setSuccess({ id: order.id, link });
            toast.success('Link gerado com sucesso!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao criar pedido.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopy = () => {
        if (!success) return;
        navigator.clipboard?.writeText(success.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        if (!success) return;
        const name = selectedCustomer?.name || newCustomer.name;
        const phone = (selectedCustomer?.phone || newCustomer.phone).replace(/\D/g, '');
        const msg = encodeURIComponent(`Olá ${name}! 😊\n\nSeu link de pagamento La Botica está pronto:\n💰 Valor: ${fmtCurrency(finalValue)}\n🔗 ${success.link}\n\nQualquer dúvida, estamos à disposição!`);
        window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
    };

    // Success View
    if (success) {
        return (
            <div className="max-w-lg mx-auto space-y-6 pt-8">
                <Card>
                    <CardContent className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-success-500/10 text-success-500 flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Link Gerado!</h2>
                            <p className="text-muted-foreground text-sm mt-1">Envie o link para o cliente finalizar o pagamento.</p>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-sm font-mono text-foreground break-all text-left">
                            {success.link}
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={handleCopy} variant={copied ? 'default' : 'outline'} className={copied ? 'bg-success-500 hover:bg-success-600 text-white' : ''}>
                                {copied ? <><Check className="w-4 h-4 mr-2" /> Copiado!</> : <><Copy className="w-4 h-4 mr-2" /> Copiar Link</>}
                            </Button>
                            <Button onClick={handleWhatsApp} className="bg-[#25D366] hover:bg-[#1DA851] text-white">
                                <Send className="w-4 h-4 mr-2" /> Enviar via WhatsApp
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/orders')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Pedidos
                    </Button>
                    <Button
                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white"
                        onClick={() => {
                            setSuccess(null);
                            setSelectedCustomer(null);
                            setQuery('');
                            setTotalValue('');
                            setFormulas([emptyFormula()]);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Novo Link
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Novo Link de Pagamento</h1>
                <p className="text-muted-foreground text-sm mt-1">Preencha os dados da fórmula para gerar o link.</p>
            </div>

            {/* Customer Section */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" /> Dados do Cliente
                        </CardTitle>
                        <div className="flex gap-1">
                            <Button variant={mode === 'search' ? 'default' : 'outline'} size="sm" className={mode === 'search' ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''} onClick={() => setMode('search')}>Buscar</Button>
                            <Button variant={mode === 'new' ? 'default' : 'outline'} size="sm" className={mode === 'new' ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''} onClick={() => setMode('new')}>Novo</Button>
                            <Button variant={mode === 'none' ? 'default' : 'outline'} size="sm" className={mode === 'none' ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''} onClick={() => { setMode('none'); setSelectedCustomer(null); setQuery(''); }}>Sem cliente</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {mode === 'none' ? (
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <p className="text-sm text-muted-foreground">O link será gerado sem vínculo a um cliente. Os dados serão preenchidos no checkout.</p>
                        </div>
                    ) : mode === 'search' ? (
                        <div ref={dropdownRef} className="relative">
                            <Label>Buscar Cliente</Label>
                            <div className="relative mt-1.5">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="Digite nome ou CPF..." value={query} onChange={(e) => { setQuery(e.target.value); setSelectedCustomer(null); }} />
                            </div>
                            {showDropdown && results.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {results.map((c) => (
                                        <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3 border-b border-border/50 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">{c.name.charAt(0)}</div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                                                <p className="text-xs text-muted-foreground">{c.cpf || c.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedCustomer && (
                                <div className="mt-3 p-3 bg-muted rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">{selectedCustomer.name.charAt(0)}</div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{selectedCustomer.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedCustomer(null); setQuery(''); }}>
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><Label>Nome Completo *</Label><Input className="mt-1.5" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                            <div><Label>E-mail</Label><Input className="mt-1.5" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
                            <div><Label>CPF</Label><Input className="mt-1.5" value={newCustomer.cpf} onChange={(e) => setNewCustomer({ ...newCustomer, cpf: maskCPF(e.target.value) })} maxLength={14} /></div>
                            <div className="md:col-span-2"><Label>WhatsApp *</Label><Input className="mt-1.5" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: maskPhone(e.target.value) })} maxLength={15} /></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Values */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary-500" /> Valores do Pedido
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div>
                        <Label>Valor Total da Fórmula *</Label>
                        <Input className="mt-1.5 text-lg font-bold" placeholder="R$ 0,00" value={totalValue ? `R$ ${maskCurrency(totalValue)}` : ''} onChange={(e) => setTotalValue(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label>Desconto <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                                <div className="flex gap-1">
                                    <Button variant={discountType === 'FIXED' ? 'default' : 'outline'} size="sm" className={`h-6 px-2 text-xs ${discountType === 'FIXED' ? 'bg-primary-500 text-white' : ''}`} onClick={() => setDiscountType('FIXED')}>R$</Button>
                                    <Button variant={discountType === 'PERCENTAGE' ? 'default' : 'outline'} size="sm" className={`h-6 px-2 text-xs ${discountType === 'PERCENTAGE' ? 'bg-primary-500 text-white' : ''}`} onClick={() => setDiscountType('PERCENTAGE')}><Percent className="w-3 h-3" /></Button>
                                </div>
                            </div>
                            <Input placeholder={discountType === 'FIXED' ? 'R$ 0,00' : '0%'} value={discountType === 'FIXED' && discountValue ? `R$ ${maskCurrency(discountValue)}` : discountValue} onChange={(e) => setDiscountValue(discountType === 'FIXED' ? e.target.value.replace(/\D/g, '') : e.target.value.replace(/[^\d]/g, '').slice(0, 3))} />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label>Frete</Label>
                                <div className="flex gap-1">
                                    <Button variant={shippingType === 'FIXED' ? 'default' : 'outline'} size="sm" className={`h-6 px-2 text-xs ${shippingType === 'FIXED' ? 'bg-primary-500 text-white' : ''}`} onClick={() => setShippingType('FIXED')}>Fixo</Button>
                                    <Button variant={shippingType === 'FREE' ? 'default' : 'outline'} size="sm" className={`h-6 px-2 text-xs ${shippingType === 'FREE' ? 'bg-primary-500 text-white' : ''}`} onClick={() => setShippingType('FREE')}>Grátis</Button>
                                    <Button variant={shippingType === 'DYNAMIC' ? 'default' : 'outline'} size="sm" className={`h-6 px-2 text-xs ${shippingType === 'DYNAMIC' ? 'bg-primary-500 text-white' : ''}`} onClick={() => setShippingType('DYNAMIC')}>Calculado</Button>
                                </div>
                            </div>
                            <Input placeholder="R$ 0,00" disabled={shippingType === 'FREE' || shippingType === 'DYNAMIC'} value={shippingType === 'FREE' ? 'Grátis' : shippingType === 'DYNAMIC' ? 'Calculado no Checkout' : shippingValue ? `R$ ${maskCurrency(shippingValue)}` : ''} onChange={(e) => setShippingValue(e.target.value.replace(/\D/g, ''))} />
                        </div>
                    </div>
                    {total > 0 && (
                        <div className="bg-muted rounded-lg p-4 space-y-1.5 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground">{fmtCurrency(total)}</span></div>
                            {discount > 0 && <div className="flex justify-between text-success-500"><span>Desconto {discountType === 'PERCENTAGE' ? `(${toCents(discountValue)}%)` : ''}</span><span>- {fmtCurrency(discount)}</span></div>}
                            {shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span className="text-foreground">+ {fmtCurrency(shipping)}</span></div>}
                            <div className="border-t border-border pt-1.5 flex justify-between font-bold text-foreground"><span>Total</span><span className="text-primary-500">{fmtCurrency(finalValue)}</span></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Items */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary-500" /> Itens / Fórmulas
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={() => setFormulas([...formulas, emptyFormula()])}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Fórmula
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {formulas.map((f, idx) => (
                        <div key={idx} className="rounded-lg border border-border p-4 space-y-3 relative">
                            {formulas.length > 1 && (
                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-error-500" onClick={() => setFormulas(formulas.filter((_, i) => i !== idx))}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2"><Label>Nome da Fórmula</Label><Input className="mt-1.5" placeholder="Ex: Minoxidil 5%" value={f.name} onChange={(e) => updateFormula(idx, 'name', e.target.value)} /></div>
                                <div><Label>Preço</Label><Input className="mt-1.5" placeholder="R$ 0,00" value={f.price ? `R$ ${maskCurrency(f.price)}` : ''} onChange={(e) => updateFormula(idx, 'price', e.target.value.replace(/\D/g, ''))} /></div>
                            </div>
                            <div><Label>Dosagem</Label><Input className="mt-1.5" placeholder="Ex: 30ml" value={f.dosage} onChange={(e) => updateFormula(idx, 'dosage', e.target.value)} /></div>
                            <div>
                                <Label>Ativos</Label>
                                <div className="flex gap-2 mt-1.5">
                                    <Input placeholder="Ex: Finasterida 1mg" value={f.activeInput} onChange={(e) => updateFormula(idx, 'activeInput', e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addActive(idx))} />
                                    <Button variant="outline" size="icon" onClick={() => addActive(idx)}><Plus className="w-4 h-4" /></Button>
                                </div>
                                {f.actives.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {f.actives.map((a, aIdx) => (
                                            <Badge key={aIdx} variant="secondary" className="gap-1">
                                                {a}
                                                <button onClick={() => removeActive(idx, aIdx)} className="hover:text-error-500"><X className="w-3 h-3" /></button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>Cancelar</Button>
                <Button className="flex-1 bg-primary-500 hover:bg-primary-600 text-white" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? 'Gerando...' : 'Gerar Link de Pagamento'}
                </Button>
            </div>
        </div>
    );
}
