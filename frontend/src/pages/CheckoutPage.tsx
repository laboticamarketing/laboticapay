import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { checkoutService, CheckoutOrder, PaymentResult } from '@/services/checkout.service';
import {
    User, MapPin, CreditCard, Check, ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
    Copy, Loader2, ShoppingBag, QrCode, Shield, UploadCloud, Building, Home, Building2, Eye, Edit, Truck
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { validateCpf, maskRG, maskCPF, maskCEP, maskPhone, maskOnlyDigits, formatPhoneForDisplay, validatePhone } from '@/lib/validation';
import { useShippingQuotes } from '@/hooks/useShippingQuotes';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const STEPS = [
    { id: 'identificacao', label: 'Identificação', icon: User },
    { id: 'endereco', label: 'Endereço', icon: MapPin },
    { id: 'contato', label: 'Contato', icon: ShoppingBag }, // Reusing shopping bag or similar icon for now
    { id: 'confirmacao', label: 'Confirmação', icon: Shield },
];

const PICKUP_LOCATIONS = [
    {
        id: 'alfenas-01',
        title: 'La Botica | Alfenas | Filial 01',
        address: 'Rua Francisco Mariano, 182 - Centro, Alfenas - MG'
    },
    {
        id: 'alfenas-02',
        title: 'La Botica | Alfenas | Filial 02',
        address: 'Av. Gov. Valadares, 485 - Centro, Alfenas - MG'
    },
    {
        id: 'machado',
        title: 'La Botica | Machado',
        address: 'Pça. Antônio Carlos, 102 - Centro, Machado - MG'
    },
    {
        id: 'pocos-de-caldas',
        title: 'La Botica | Poços de Caldas',
        address: 'Rua Prefeito Chagas, 282 - Centro, Poços de Caldas - MG'
    }
];

export default function CheckoutPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const location = useLocation();
    const isSuccessRoute = location.pathname.endsWith('/success');
    const [order, setOrder] = useState<CheckoutOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [lookingUpCpf, setLookingUpCpf] = useState(false);

    // Step 1: Identificação
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [rg, setRg] = useState('');

    // Step 2: Endereço
    const [cep, setCep] = useState('');
    const [street, setStreet] = useState('');
    const [number, setNumber] = useState('');
    const [noNumber, setNoNumber] = useState(false);
    const [neighborhood, setNeighborhood] = useState('');
    const [complement, setComplement] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('BA');
    const [addressType, setAddressType] = useState<'Casa' | 'Trabalho' | 'Outro'>('Casa');
    const [deliveryMethod, setDeliveryMethod] = useState<'SHIP' | 'PICKUP'>('SHIP');
    const [pickupLocationId, setPickupLocationId] = useState('');

    const { shippingQuotes, loadingQuotes, selectedQuoteId, setSelectedQuoteId, fetchShippingQuotes, selectQuote } =
        useShippingQuotes({ order, setOrder });

    // Step 3: Contato
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [observations, setObservations] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    // Step 4: Pagamento
    const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD' | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

    // Mobile resumo retrátil
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

    // Inline edit on confirmation step
    const [editPersonalOpen, setEditPersonalOpen] = useState(false);
    const [editAddressOpen, setEditAddressOpen] = useState(false);
    const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Persistir passo do checkout (voltar de onde parou) ───
    useEffect(() => {
        if (!orderId) return;
        const stored = localStorage.getItem(`checkout_step_${orderId}`);
        if (stored !== null) {
            const parsed = Number(stored);
            if (!Number.isNaN(parsed)) {
                setStep(parsed);
            }
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        localStorage.setItem(`checkout_step_${orderId}`, String(step));
    }, [orderId, step]);

    useEffect(() => {
        if (!orderId) return;
        checkoutService.getOrder(orderId)
            .then((data) => {
                setOrder(data);
                if (data.customer) {
                    setCpf(data.customer.cpf ? maskCPF(data.customer.cpf) : '');
                    setName(data.customer.name === 'Cliente Não Identificado' ? '' : (data.customer.name || ''));
                    setEmail(data.customer.email || '');
                    setPhone(formatPhoneForDisplay(data.customer.phone));
                    setRg(data.customer.rg ? maskRG(data.customer.rg) : '');
                    setBirthDate(data.customer.birthDate ? new Date(data.customer.birthDate).toISOString().split('T')[0] : '');

                    const addr = data.customer.addresses?.find(a => a.isPrimary) || data.customer.addresses?.[0];
                    if (addr) {
                        setCep(addr.zip ? maskCEP(addr.zip) : '');
                        setStreet(addr.street || '');
                        setNumber(addr.number === 'SN' || addr.number === 'S/N' ? '' : addr.number);
                        if (addr.number === 'SN' || addr.number === 'S/N') setNoNumber(true);
                        setNeighborhood(addr.neighborhood || '');
                        setCity(addr.city || '');
                        setState(addr.state || 'BA');
                        setComplement(addr.complement || '');
                    }
                }
            })
            .catch(() => toast.error('Pedido não encontrado'))
            .finally(() => setLoading(false));
    }, [orderId]);

    // Quando estiver na rota /checkout/:id/success, mas o pedido ainda não estiver
    // marcado como PAID (delay de webhook), fazemos polling até confirmar.
    useEffect(() => {
        if (!orderId || !isSuccessRoute) return;
        if (order?.status === 'PAID') return;

        let active = true;
        const interval = setInterval(async () => {
            try {
                const refreshed = await checkoutService.getOrder(orderId);
                if (!active) return;
                setOrder(refreshed);
                if (refreshed.status === 'PAID') {
                    clearInterval(interval);
                }
            } catch {
                // silencioso
            }
        }, 4000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [orderId, isSuccessRoute, order?.status]);

    // ─── CPF auto-lookup ───
    useEffect(() => {
        const rawCpf = cpf.replace(/\D/g, '');
        if (rawCpf.length === 11 && !name && !lookingUpCpf) {
            handleCpfLookup(rawCpf);
        }
    }, [cpf]);

    const handleCpfLookup = async (rawCpf: string) => {
        setLookingUpCpf(true);
        try {
            const res = await checkoutService.lookupByCpf(rawCpf);
            if (res.found && res.customer) {
                toast.success('Cliente encontrado! Preenchemos seus dados.');
                setName(res.customer.name);
                setEmail(res.customer.email || '');
                setPhone(formatPhoneForDisplay(res.customer.phone));
                setRg(res.customer.rg ? maskRG(res.customer.rg) : '');
                if (res.customer.birthDate) {
                    setBirthDate(new Date(res.customer.birthDate).toISOString().split('T')[0]);
                }

                const addr = res.customer.addresses?.[0];
                if (addr) {
                    setCep(addr.zip ? maskCEP(addr.zip) : '');
                    setStreet(addr.street || '');
                    setNumber(addr.number === 'SN' || addr.number === 'S/N' ? '' : addr.number);
                    setNeighborhood(addr.neighborhood);
                    setCity(addr.city);
                    setState(addr.state);
                    setComplement(addr.complement || '');

                    if (order?.shippingType === 'DYNAMIC') {
                        await fetchShippingQuotes(addr.zip, 'Erro ao calcular frete Automático para o endereço salvo.');
                    }
                }

                // Se o cliente foi identificado:
                // - Para frete DINÂMICO, levamos para a etapa de Endereço/Entrega
                //   para ele escolher claramente a forma de entrega e o frete.
                // - Para frete FIXO ou GRÁTIS, podemos pular direto para a
                //   confirmação (dados já conhecidos).
                if (res.customer.phone) {
                    if (order?.shippingType === 'DYNAMIC') {
                        setStep(1); // endereço + escolha de entrega/frete
                    } else {
                        setStep(3); // confirmação e pagamento
                    }
                }
            }
        } catch {
            // Not found or error, silently fail to let user type
        } finally {
            setLookingUpCpf(false);
        }
    };

    // ─── CEP auto-fill ───
    const fetchCep = async (value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setStreet(data.logradouro || '');
                setNeighborhood(data.bairro || '');
                setCity(data.localidade || '');
                setState(data.uf || '');

                if (order?.shippingType === 'DYNAMIC') {
                    await fetchShippingQuotes(clean, 'Erro ao calcular frete Automático.');
                }
            }
        } catch { /* ignore */ }
    };

    // ─── Step Actions ───
    const goStep2 = async () => {
        if (!cpf || !name || !birthDate || !rg) {
            toast.error('Preencha os campos obrigatórios.');
            return;
        }
        if (!validateCpf(cpf)) {
            toast.error('CPF inválido.');
            return;
        }
        setStep(1);
    };

    const goStep3 = async () => {
        if (deliveryMethod === 'SHIP') {
            if (!cep || !street || (!number && !noNumber) || !neighborhood || !city || !state) {
                toast.error('Preencha todos os campos do endereço.');
                return;
            }
            if (order?.shippingType === 'DYNAMIC' && !selectedQuoteId) {
                toast.error('Selecione uma opção de frete.');
                return;
            }
        } else if (deliveryMethod === 'PICKUP') {
            if (!pickupLocationId) {
                toast.error('Escolha a unidade para retirada.');
                return;
            }
        }
        setStep(2);
    };

    const goStep4 = async () => {
        if (!phone) {
            toast.error('Telefone/WhatsApp é obrigatório.');
            return;
        }
        if (!validatePhone(phone)) {
            toast.error('Número de Telefone/WhatsApp inválido.');
            return;
        }

        // Save progress before showing confirmation
        if (!orderId) return;
        setSubmitting(true);
        try {
            await checkoutService.saveProgress(orderId, {
                name, email, phone, cpf, rg, birthDate, notes: observations,
                deliveryMethod,
                address: deliveryMethod === 'SHIP' ? {
                    zip: cep, street, number: noNumber ? 'SN' : number,
                    neighborhood, city, state, complement
                } : undefined,
                pickupLocation: deliveryMethod === 'PICKUP' ? PICKUP_LOCATIONS.find(l => l.id === pickupLocationId)?.title : undefined,
                shippingValue: (deliveryMethod === 'SHIP' && order?.shippingType === 'DYNAMIC') ? order?.shippingValue : undefined,
            });
            setStep(3); // Confirmação
        } catch {
            toast.error('Erro ao salvar dados');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePayment = async () => {
        if (!orderId || !order || !paymentMethod) return;
        setSubmitting(true);
        try {
            const total = order.totalValue + (order.shippingValue || 0) - (order.discountValue || 0);
            const result = await checkoutService.processPayment(orderId, {
                amount: Math.round(total * 100) / 100, // Make sure it's valid precision
                paymentMethod: paymentMethod === 'PIX' ? 'PIX' : 'BILLING', // CARD goes to hosted checkou billing currently
                customerData: { name, email, cpf, phone },
            });
            setPaymentResult(result);
            if (result.success) {
                toast.success(result.message);
                if (result.billingUrl) {
                    window.open(result.billingUrl, '_blank');
                }
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao processar pagamento');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Loading / Error ───
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
                <Card className="max-w-sm w-full text-center">
                    <CardContent className="p-5 space-y-3">
                        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
                        <h2 className="text-lg font-semibold">Pedido não encontrado</h2>
                        <p className="text-sm text-muted-foreground">O link pode ter expirado ou ser inválido.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (order.status === 'PAID') {
        return <SuccessView order={order} />;
    }

    const effectiveShippingValue = deliveryMethod === 'PICKUP' ? 0 : (order.shippingValue || 0);
    const total = order.totalValue + effectiveShippingValue - (order.discountValue || 0);
    const installmentValue = total / 6;

    return (
        <div className="min-h-screen bg-neutral-50 pb-16 lg:pb-12 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-border shadow-sm sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-checkout.png"
                            alt="La Botica"
                            className="h-9 w-auto object-contain"
                        />
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm min-h-[44px]">
                        <Shield className="w-4 h-4 mr-2 shrink-0" />
                        <span className="text-[14px]">Ambiente 100% Seguro</span>
                    </div>
                </div>
            </header>

            <div className="max-w-5xl mx-auto px-3 py-5 flex-1 w-full">
                {/* Stepper */}
                <div className="flex items-center justify-center mb-6 lg:mb-10 max-w-2xl mx-auto">
                    {STEPS.map((s, i) => {
                        const isCompleted = step > i;
                        const isActive = step === i;
                        return (
                            <div key={s.id} className="flex flex-col items-center relative z-10 w-1/4">
                                <div className="absolute top-5 left-1/2 w-full h-[2px] bg-border -z-10" style={{ display: i === STEPS.length - 1 ? 'none' : 'block' }}>
                                    <div className={`h-full bg-primary-400 transition-all ${isCompleted ? 'w-full' : 'w-0'}`} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => i < step && setStep(i)}
                                    className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${isCompleted ? 'bg-primary-50 text-primary-600 border border-primary-200 cursor-pointer' :
                                        isActive ? 'bg-primary-500 text-white border border-primary-600' :
                                            'bg-white text-muted-foreground border border-border'
                                        }`}
                                    aria-label={`Passo ${i + 1}: ${s.label}`}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Order Summary (retrátil) */}
                <div className="lg:hidden mb-4">
                    <Card className="border shadow-sm overflow-hidden rounded-2xl bg-white">
                        <button
                            type="button"
                            onClick={() => setMobileSummaryOpen((v) => !v)}
                            className="w-full flex items-center justify-between px-3 py-2 min-h-[44px] bg-white touch-manipulation"
                            aria-expanded={mobileSummaryOpen}
                            aria-label={mobileSummaryOpen ? 'Ocultar resumo do pedido' : 'Ver resumo do pedido'}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <ShoppingBag className="w-4 h-4 text-primary-600 shrink-0" />
                                <div className="text-left min-w-0">
                                    <p className="text-sm font-bold text-foreground whitespace-nowrap truncate" style={{ fontSize: '15px' }}>Resumo do Pedido</p>
                                    <p className="text-sm font-medium text-primary-600 flex items-center gap-1">
                                        {mobileSummaryOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
                                        {mobileSummaryOpen ? (
                                            <ChevronUp className="w-3 h-3 text-primary-600" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 text-primary-600" />
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-base font-black text-foreground" style={{ fontSize: '16px' }}>{formatCurrency(total)}</p>
                            </div>
                        </button>

                        {mobileSummaryOpen && (
                            <CardContent className="space-y-3 pt-2 pb-3 px-3">
                                <div className="space-y-3">
                                    {order.items.length > 0 ? order.items.map((item, i) => (
                                        <div key={item.id || i} className="flex gap-3">
                                            <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-foreground" style={{ fontSize: '14px' }}>{item.name}</p>
                                                {item.dosage && <p className="text-sm text-muted-foreground mt-0.5" style={{ fontSize: '13px' }}>{item.dosage}</p>}
                                            </div>
                                            {typeof item.price === 'number' && (
                                                <span className="text-sm font-semibold text-foreground" style={{ fontSize: '14px' }}>
                                                    {formatCurrency(item.price)}
                                                </span>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="flex gap-3">
                                            <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0">
                                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate text-foreground" style={{ fontSize: '14px' }}>Fórmula Personalizada</p>
                                                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontSize: '13px' }}>Orçamento sob medida</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div className="space-y-1.5 text-sm" style={{ fontSize: '14px' }}>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal</span>
                                        <span className="text-foreground">{formatCurrency(order.totalValue)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>{deliveryMethod === 'PICKUP' ? 'Retirada' : 'Frete'}</span>
                                        <span className={(effectiveShippingValue === 0 || deliveryMethod === 'PICKUP' || order.shippingType === 'FREE' || order.shippingType === 'DYNAMIC') ? "font-medium text-primary-600" : "text-foreground"}>
                                            {deliveryMethod === 'PICKUP' ? 'Retirada Grátis' :
                                                order.shippingType === 'FREE' ? 'Grátis' :
                                                    (order.shippingType === 'DYNAMIC' && effectiveShippingValue === 0) ? (
                                                        <span className="text-amber-500">A ser calculado</span>
                                                    ) : (
                                                        formatCurrency(effectiveShippingValue)
                                                    )}
                                        </span>
                                    </div>
                                    {order.discountValue > 0 && (
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Desconto</span>
                                            <span className="text-primary-600">-{formatCurrency(order.discountValue)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground uppercase tracking-wide" style={{ fontSize: '13px' }}>Total</p>
                                        <p className="text-lg font-black text-foreground mt-0.5" style={{ fontSize: '16px' }}>{formatCurrency(total)}</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground text-right" style={{ fontSize: '13px' }}>
                                        ou 6x de {formatCurrency(installmentValue)} s/ juros
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
                    {/* Left Column: Form Content */}
                    <div className="space-y-6">
                        {paymentResult?.success ? (
                            <Card>
                                <CardContent className="p-5">
                                    <PaymentResultView result={paymentResult} total={total} order={order} />
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border shadow-sm">
                                <CardContent className="p-4">
                                    {/* STEP 1: IDENTIFICAÇÃO */}
                                    {step === 0 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 text-primary-700 font-semibold text-base mb-4" style={{ fontSize: '16px' }}>
                                                <User className="w-5 h-5 shrink-0" /> Informações Pessoais
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="flex items-center justify-between text-sm" style={{ fontSize: '14px' }}>
                                                        <span>CPF <span className="text-destructive">*</span></span>
                                                        {lookingUpCpf && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                                                    </Label>
                                                    <Input
                                                        value={cpf}
                                                        onChange={e => setCpf(maskCPF(e.target.value))}
                                                        placeholder="000.000.000-00"
                                                        maxLength={14}
                                                        className="text-base min-h-[48px]"
                                                        style={{ fontSize: '16px' }}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm" style={{ fontSize: '14px' }}>Nome Completo <span className="text-destructive">*</span></Label>
                                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Digite seu nome completo" className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Data de Nascimento <span className="text-destructive">*</span></Label>
                                                        <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>RG <span className="text-destructive">*</span></Label>
                                                        <Input value={rg} onChange={e => setRg(maskRG(e.target.value))} placeholder="00.000.000-00" maxLength={13} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t mt-4 border-border/50">
                                                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold flex gap-2 w-full justify-center min-h-[48px] text-base" size="lg" onClick={goStep2} style={{ fontSize: '16px' }}>
                                                    Avançar <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: ENDEREÇO */}
                                    {step === 1 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 text-primary-700 font-semibold text-base mb-2" style={{ fontSize: '16px' }}>
                                                <MapPin className="w-5 h-5 shrink-0" /> Endereço
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm" style={{ fontSize: '14px' }}>CEP <span className="text-destructive">*</span></Label>
                                                    <Input value={cep} onChange={e => { setCep(maskCEP(e.target.value)); fetchCep(e.target.value); }} placeholder="00000-000" maxLength={9} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Rua / Logradouro <span className="text-destructive">*</span></Label>
                                                        <Input value={street} onChange={e => setStreet(e.target.value)} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Número <span className="text-destructive">*</span></Label>
                                                        <Input value={number} onChange={e => setNumber(maskOnlyDigits(e.target.value, 10))} disabled={noNumber} placeholder="Ex: 123" className="text-base min-h-[48px]" style={{ fontSize: '16px' }} inputMode="numeric" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2 min-h-[48px]">
                                                    <Checkbox id="noNumber" checked={noNumber} onCheckedChange={(c: boolean) => { setNoNumber(c); if (c) setNumber(''); }} />
                                                    <label htmlFor="noNumber" className="text-sm font-medium leading-none cursor-pointer" style={{ fontSize: '14px' }}>Sem número</label>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Bairro <span className="text-destructive">*</span></Label>
                                                        <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Complemento</Label>
                                                        <Input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto, Bloco, etc." className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Cidade <span className="text-destructive">*</span></Label>
                                                        <Input value={city} onChange={e => setCity(e.target.value)} className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>UF <span className="text-destructive">*</span></Label>
                                                        <select className="flex h-12 w-full min-h-[48px] rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background" style={{ fontSize: '16px' }} value={state} onChange={e => setState(e.target.value)}>
                                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                                <option key={uf} value={uf}>{uf}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2">
                                                    <Label className="text-muted-foreground text-sm font-normal" style={{ fontSize: '14px' }}>Tipo de Endereço (Opcional)</Label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {(['Casa', 'Trabalho', 'Outro'] as const).map(type => (
                                                            <button
                                                                key={type}
                                                                type="button"
                                                                onClick={() => setAddressType(type)}
                                                                className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 py-3 rounded-lg border text-sm transition-colors min-h-[48px] ${addressType === type ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-border text-muted-foreground hover:bg-muted'
                                                                    }`}
                                                                style={{ fontSize: '14px' }}
                                                            >
                                                                {type === 'Casa' ? <Home className="w-4 h-4" /> : type === 'Trabalho' ? <Building2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Separator className="my-4" />

                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-primary-700 font-semibold mb-2 text-sm" style={{ fontSize: '15px' }}>
                                                        <Building className="w-5 h-5 shrink-0" /> Método de Entrega
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeliveryMethod('SHIP')}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-colors min-h-[48px] text-sm ${deliveryMethod === 'SHIP' ? 'border-primary-500 text-primary-600 shadow-sm' : 'border-border text-muted-foreground bg-muted/30 hover:bg-muted'
                                                                }`}
                                                            style={{ fontSize: '14px' }}
                                                        >
                                                            Entrega
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeliveryMethod('PICKUP')}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border font-medium transition-colors min-h-[48px] text-sm ${deliveryMethod === 'PICKUP' ? 'border-primary-500 text-primary-600 shadow-sm' : 'border-border text-muted-foreground bg-muted/30 hover:bg-muted'
                                                                }`}
                                                            style={{ fontSize: '14px' }}
                                                        >
                                                            Retirar na Loja
                                                        </button>
                                                    </div>

                                                    {deliveryMethod === 'PICKUP' && (
                                                        <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                                            <p className="text-sm font-medium text-foreground">Escolha a unidade para retirada:</p>
                                                            {PICKUP_LOCATIONS.map((loc) => (
                                                                <label
                                                                    key={loc.id}
                                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${pickupLocationId === loc.id ? 'border-primary-500 bg-primary-50/50' : 'border-border hover:bg-muted/50'}`}
                                                                >
                                                                    <div className="mt-0.5 pt-0.5">
                                                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${pickupLocationId === loc.id ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                            {pickupLocationId === loc.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full" onClick={() => setPickupLocationId(loc.id)}>
                                                                        <p className="font-semibold text-foreground text-sm">{loc.title}</p>
                                                                        <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>
                                                                        <div className="mt-2 text-[11px] font-medium bg-[#ecfdf5] text-[#059669] w-fit px-2 py-0.5 rounded">
                                                                            Retirada gratuita
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {deliveryMethod === 'SHIP' && (
                                                        <div className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2">
                                                            {order?.shippingType === 'DYNAMIC' ? (
                                                                <>
                                                                    <p className="text-sm font-medium text-foreground">Opções de Frete:</p>
                                                                    {loadingQuotes ? (
                                                                        <div className="flex items-center gap-2 p-3 rounded-lg border text-sm text-muted-foreground bg-muted/30">
                                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                                            Calculando frete...
                                                                        </div>
                                                                    ) : shippingQuotes.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                            {shippingQuotes.map(quote => (
                                                                                <label
                                                                                    key={quote.id}
                                                                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedQuoteId === quote.id ? 'border-primary-500 bg-primary-50/50' : 'border-border hover:bg-muted/50'}`}
                                                                                >
                                                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${selectedQuoteId === quote.id ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                                        {selectedQuoteId === quote.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1">
                                                                                        <p className="font-semibold text-foreground text-sm truncate">
                                                                                            {quote.name}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground mt-0.5">Entrega em até {quote.deliveryTime} dias úteis</p>
                                                                                        <p className="font-bold text-primary-600 text-sm mt-1" style={{ fontSize: '15px' }}>
                                                                                            {formatCurrency(quote.price)}
                                                                                        </p>
                                                                                    </div>
                                                                                    <input
                                                                                        type="radio"
                                                                                        className="hidden"
                                                                                        name="shipping_quote"
                                                                                        value={quote.id}
                                                                                        checked={selectedQuoteId === quote.id}
                                                                                        onChange={() => selectQuote(quote)}
                                                                                    />
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg flex items-start gap-2 text-sm border border-primary-100 mt-4">
                                                                            <div className="w-5 h-5 rounded-full border border-primary-300 flex items-center justify-center shrink-0 text-xs font-bold text-primary-500 mt-0.5">i</div>
                                                                            Digite seu CEP para calcular as opções de entrega.
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="bg-primary-50 text-primary-700 p-3 rounded-lg flex items-start gap-2 text-sm border border-primary-100 mt-4">
                                                                    <div className="w-5 h-5 rounded-full border border-primary-300 flex items-center justify-center shrink-0 text-xs font-bold text-primary-500 mt-0.5">i</div>
                                                                    O valor será calculado com base no seu endereço. (Algumas cidades possuem taxa fixa local).
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-3 border-t mt-4 border-border/50">
                                                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold flex gap-2 w-full sm:w-auto justify-center min-h-[48px] px-8 order-1 sm:order-2 text-base" size="lg" onClick={goStep3} style={{ fontSize: '16px' }}>
                                                    Avançar <ChevronRight className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" onClick={() => setStep(0)} className="text-muted-foreground min-h-[48px] text-sm w-full sm:w-auto order-2 sm:order-1" style={{ fontSize: '14px' }}>
                                                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: CONTATO E DOCUMENTOS */}
                                    {step === 2 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 text-primary-700 font-semibold text-base mb-4" style={{ fontSize: '16px' }}>
                                                <FileText className="w-5 h-5 shrink-0" /> Contato e Documentos
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>Telefone / WhatsApp <span className="text-destructive">*</span></Label>
                                                        <Input value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm" style={{ fontSize: '14px' }}>E-mail <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                                                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" className="text-base min-h-[48px]" style={{ fontSize: '16px' }} />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm" style={{ fontSize: '14px' }}>Observações <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
                                                    <textarea
                                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        style={{ fontSize: '16px' }}
                                                        placeholder="Ex: Deixar na portaria, campainha não funciona..."
                                                        value={observations}
                                                        onChange={e => setObservations(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm" style={{ fontSize: '14px' }}>Anexo da Receita <span className="text-muted-foreground font-normal">(Opcional) - PDF, JPG ou PNG - Max 10MB</span></Label>
                                                    <div
                                                        className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors min-h-[100px] flex flex-col items-center justify-center"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-3 shrink-0" />
                                                        <p className="font-medium text-foreground text-sm" style={{ fontSize: '15px' }}>Clique ou arraste o arquivo aqui</p>
                                                        <p className="text-sm text-muted-foreground mt-1" style={{ fontSize: '14px' }}>{attachment ? attachment.name : 'Nenhum arquivo selecionado'}</p>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            ref={fileInputRef}
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={e => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setAttachment(e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-3 border-t mt-4 border-border/50">
                                                <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold flex gap-2 w-full sm:w-auto justify-center min-h-[48px] px-8 order-1 sm:order-2 text-base" size="lg" onClick={goStep4} disabled={submitting} style={{ fontSize: '16px' }}>
                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                    Avançar <ChevronRight className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground min-h-[48px] text-sm w-full sm:w-auto order-2 sm:order-1" style={{ fontSize: '14px' }} disabled={submitting}>
                                                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: CONFIRMAIR E PAGAR */}
                                    {step === 3 && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2 text-primary-600 font-semibold text-base mb-2" style={{ fontSize: '16px' }}>
                                                <Check className="w-5 h-5 shrink-0" /> Confirmar e Pagar
                                            </div>

                                            {/* Review sections */}
                                            <div className="space-y-4">
                                                {/* Personal Data */}
                                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-sm">Dados Pessoais</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditPersonalOpen(true)}
                                                            className="text-primary-600 text-sm font-medium hover:underline"
                                                        >
                                                            Editar
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                                                        <span><strong className="text-foreground font-medium">Nome:</strong> {name}</span>
                                                        <span><strong className="text-foreground font-medium">CPF:</strong> {cpf}</span>
                                                    </div>

                                                    {editPersonalOpen && (
                                                        <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs">Nome Completo</Label>
                                                                    <Input
                                                                        value={name}
                                                                        onChange={e => setName(e.target.value)}
                                                                        placeholder="Nome do cliente"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs">CPF</Label>
                                                                    <Input
                                                                        value={cpf}
                                                                        onChange={e => setCpf(maskCPF(e.target.value))}
                                                                        maxLength={14}
                                                                        placeholder="000.000.000-00"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs">Data de Nascimento</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={birthDate}
                                                                        onChange={e => setBirthDate(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs">RG</Label>
                                                                    <Input
                                                                        value={rg}
                                                                        onChange={e => setRg(maskRG(e.target.value))}
                                                                        maxLength={13}
                                                                        placeholder="00.000.000-00"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-end gap-2 pt-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setEditPersonalOpen(false)}
                                                                >
                                                                    Cancelar
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    className="bg-primary-500 hover:bg-primary-600 text-white"
                                                                    onClick={() => setEditPersonalOpen(false)}
                                                                >
                                                                    Salvar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Address Info */}
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm mt-4">Endereço</h4>

                                                    <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                                <Home className="w-3.5 h-3.5" /> ENDEREÇO DO CLIENTE
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditAddressOpen(true)}
                                                                className="text-primary-600 text-sm font-medium hover:underline uppercase text-xs"
                                                            >
                                                                ALTERAR
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-sm">{street}, {noNumber ? 'SN' : number}</p>
                                                        <p className="text-sm text-muted-foreground">{neighborhood} - {city}/{state}</p>
                                                        <p className="text-sm text-muted-foreground">CEP: {cep}</p>

                                                        {editAddressOpen && (
                                                            <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
                                                                <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">Rua / Logradouro</Label>
                                                                        <Input
                                                                            value={street}
                                                                            onChange={e => setStreet(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">Número</Label>
                                                                        <Input
                                                                            value={number}
                                                                            onChange={e => setNumber(maskOnlyDigits(e.target.value, 10))}
                                                                            disabled={noNumber}
                                                                            placeholder="Ex: 123"
                                                                            inputMode="numeric"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Checkbox
                                                                        id="noNumber-inline"
                                                                        checked={noNumber}
                                                                        onCheckedChange={(c: boolean) => { setNoNumber(c); if (c) setNumber(''); }}
                                                                    />
                                                                    <label htmlFor="noNumber-inline" className="text-xs font-medium leading-none cursor-pointer">
                                                                        Sem número
                                                                    </label>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">Bairro</Label>
                                                                        <Input
                                                                            value={neighborhood}
                                                                            onChange={e => setNeighborhood(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">Complemento</Label>
                                                                        <Input
                                                                            value={complement}
                                                                            onChange={e => setComplement(e.target.value)}
                                                                            placeholder="Apto, bloco, etc."
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-[1fr_100px] gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">Cidade</Label>
                                                                        <Input
                                                                            value={city}
                                                                            onChange={e => setCity(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-xs">UF</Label>
                                                                        <select
                                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background"
                                                                            value={state}
                                                                            onChange={e => setState(e.target.value)}
                                                                        >
                                                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                                                                                <option key={uf} value={uf}>{uf}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs">CEP</Label>
                                                                    <Input
                                                                        value={cep}
                                                                        onChange={e => { setCep(maskCEP(e.target.value)); fetchCep(e.target.value); }}
                                                                        maxLength={9}
                                                                        placeholder="00000-000"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end gap-2 pt-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setEditAddressOpen(false)}
                                                                    >
                                                                        Cancelar
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        className="bg-primary-500 hover:bg-primary-600 text-white"
                                                                        onClick={() => setEditAddressOpen(false)}
                                                                    >
                                                                        Salvar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="bg-primary-50/50 p-4 rounded-lg border border-primary-200">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 uppercase tracking-wider">
                                                                <ShoppingBag className="w-3.5 h-3.5" /> ENTREGA
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditDeliveryOpen(true)}
                                                                className="text-primary-600 text-sm font-medium hover:underline uppercase text-xs"
                                                            >
                                                                ALTERAR
                                                            </button>
                                                        </div>
                                                        <p className="font-medium text-sm text-primary-900">
                                                            {deliveryMethod === 'SHIP'
                                                                ? 'Entrega'
                                                                : `Retirar na Loja: ${PICKUP_LOCATIONS.find(l => l.id === pickupLocationId)?.title || ''}`}
                                                        </p>
                                                        <p className="text-sm text-primary-700">
                                                            {deliveryMethod === 'PICKUP'
                                                                ? 'Retirada Grátis'
                                                                : effectiveShippingValue > 0
                                                                    ? formatCurrency(effectiveShippingValue)
                                                                    : 'Frete Grátis'}
                                                        </p>

                                                        {editDeliveryOpen && (
                                                            <div className="mt-4 pt-3 border-t border-primary-200 space-y-3">
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                                                                        Forma de Entrega
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeliveryMethod('SHIP')}
                                                                            className={`w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${deliveryMethod === 'SHIP'
                                                                                ? 'border-primary-500 bg-white text-primary-700 shadow-sm'
                                                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/70'}`}
                                                                        >
                                                                            <Truck className="w-3.5 h-3.5" />
                                                                            Entrega
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setDeliveryMethod('PICKUP')}
                                                                            className={`w-full px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${deliveryMethod === 'PICKUP'
                                                                                ? 'border-primary-500 bg-white text-primary-700 shadow-sm'
                                                                                : 'border-border bg-background text-muted-foreground hover:bg-muted/70'}`}
                                                                        >
                                                                            <Home className="w-3.5 h-3.5" />
                                                                            Retirada na Loja
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {deliveryMethod === 'PICKUP' && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                                                                            Unidade para retirada
                                                                        </p>
                                                                        <div className="space-y-2">
                                                                            {PICKUP_LOCATIONS.map((loc) => (
                                                                                <label
                                                                                    key={loc.id}
                                                                                    className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-colors ${pickupLocationId === loc.id
                                                                                        ? 'border-primary-500 bg-white'
                                                                                        : 'border-border hover:bg-muted/70'}`}
                                                                                    onClick={() => setPickupLocationId(loc.id)}
                                                                                >
                                                                                    <div className="mt-0.5">
                                                                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${pickupLocationId === loc.id ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                                            {pickupLocationId === loc.id && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-medium text-foreground">{loc.title}</p>
                                                                                        <p className="text-[11px] text-muted-foreground">{loc.address}</p>
                                                                                    </div>
                                                                                </label>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {deliveryMethod === 'SHIP' && order?.shippingType === 'DYNAMIC' && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-semibold text-primary-700 uppercase tracking-wider">
                                                                            Opções de Frete
                                                                        </p>
                                                                        {loadingQuotes ? (
                                                                            <div className="flex items-center gap-2 p-3 rounded-lg border text-xs text-muted-foreground bg-muted/40">
                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                Calculando frete...
                                                                            </div>
                                                                        ) : shippingQuotes.length > 0 ? (
                                                                            <div className="space-y-1.5">
                                                                                {shippingQuotes.map(quote => (
                                                                                    <label
                                                                                        key={quote.id}
                                                                                        className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedQuoteId === quote.id ? 'border-primary-500 bg-primary-50/60' : 'border-border hover:bg-muted/60'}`}
                                                                                        onClick={() => selectQuote(quote)}
                                                                                    >
                                                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${selectedQuoteId === quote.id ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                                            {selectedQuoteId === quote.id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                                                        </div>
                                                                                        <div className="min-w-0 flex-1">
                                                                                            <p className="font-medium text-xs text-foreground">
                                                                                                {quote.name}
                                                                                            </p>
                                                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                                                Entrega em até {quote.deliveryTime} dias úteis
                                                                                            </p>
                                                                                            <p className="font-bold text-xs text-primary-600 mt-1">
                                                                                                {formatCurrency(quote.price)}
                                                                                            </p>
                                                                                        </div>
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="bg-primary-50 text-primary-700 p-2.5 rounded-lg flex items-start gap-2 text-xs border border-primary-100 mt-2">
                                                                                <div className="w-4 h-4 rounded-full border border-primary-300 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary-500 mt-0.5">i</div>
                                                                                Digite o CEP na etapa de endereço para calcular as opções de entrega.
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <div className="flex justify-end gap-2 pt-1">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setEditDeliveryOpen(false)}
                                                                    >
                                                                        Cancelar
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        className="bg-primary-500 hover:bg-primary-600 text-white"
                                                                        onClick={() => setEditDeliveryOpen(false)}
                                                                    >
                                                                        Salvar
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="my-6" />

                                            {/* Payment Selection */}
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="font-bold text-base" style={{ fontSize: '16px' }}>Pagamento</h3>
                                                    <p className="text-sm text-muted-foreground mt-1" style={{ fontSize: '14px' }}>Todas as transações são seguras e criptografadas.</p>
                                                </div>

                                                    <div className="space-y-3">
                                                    {/* CARD Selection */}
                                                    <label
                                                        className={`block border p-4 rounded-lg cursor-pointer transition-colors overflow-hidden ${paymentMethod === 'CARD' ? 'border-primary-500 bg-primary-50/30' : 'border-border hover:bg-muted'}`}
                                                        onClick={() => setPaymentMethod('CARD')}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'CARD' ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                {paymentMethod === 'CARD' && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                            </div>
                                                            <span className="font-medium flex-1 min-w-0 text-sm sm:text-base whitespace-nowrap truncate" style={{ fontSize: '15px' }}>Cartão de Crédito</span>
                                                            <div className="flex items-center gap-1.5 shrink-0 w-[min(100px,30%)] justify-end">
                                                                <img
                                                                    src="/icons/checkout/payments/visa.svg"
                                                                    alt="Visa"
                                                                    className="h-5 max-w-[2rem] w-auto object-contain"
                                                                />
                                                                <img
                                                                    src="/icons/checkout/payments/mastercard.svg"
                                                                    alt="Mastercard"
                                                                    className="h-5 max-w-[2rem] w-auto object-contain"
                                                                />
                                                                <span className="text-[10px] font-medium text-muted-foreground">+3</span>
                                                            </div>
                                                        </div>
                                                        {paymentMethod === 'CARD' && (
                                                            <div className="mt-4 pt-4 border-t border-border grid gap-3">
                                                                <div className="p-3 bg-muted rounded text-sm text-muted-foreground text-center">
                                                                    O pagamento será realizado no checkout seguro da AbacatePay.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </label>

                                                    {/* PIX Selection */}
                                                    <label
                                                        className={`block border p-4 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'PIX' ? 'border-primary-500 bg-primary-50/30' : 'border-border hover:bg-muted'}`}
                                                        onClick={() => setPaymentMethod('PIX')}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'PIX' ? 'border-primary-500' : 'border-muted-foreground'}`}>
                                                                {paymentMethod === 'PIX' && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                                            </div>
                                                            <span className="font-medium flex-1 text-sm sm:text-base" style={{ fontSize: '15px' }}>Pix</span>
                                                            <div className="w-12 h-5 rounded grid place-items-center opacity-80">
                                                                <img
                                                                    src="/icons/checkout/payments/pix.svg"
                                                                    alt="Pix"
                                                                    className="h-5 w-auto"
                                                                />
                                                            </div>
                                                        </div>
                                                        {paymentMethod === 'PIX' && (
                                                            <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                                                                QR Code e Chave Copia e Cola serão gerados no próximo passo. Aprovação instantânea.
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-3 border-t mt-4 border-border/50">
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white font-bold flex gap-2 w-full sm:w-auto justify-center min-h-[48px] px-8 order-1 sm:order-2 text-base"
                                                    size="lg"
                                                    onClick={handlePayment}
                                                    disabled={submitting || !paymentMethod}
                                                    style={{ fontSize: '16px' }}
                                                >
                                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                                                    Pagar Agora
                                                </Button>
                                                <Button variant="ghost" onClick={() => setStep(2)} className="text-muted-foreground min-h-[48px] text-sm w-full sm:w-auto order-2 sm:order-1" style={{ fontSize: '14px' }} disabled={submitting}>
                                                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column: Order Summary Sidebar */}
                    <div className="hidden lg:block">
                        <div className="sticky top-24">
                            <Card className="border shadow-sm">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-base font-bold">Resumo do Pedido</CardTitle>
                                    <p className="text-xs text-muted-foreground">Pedido #{order.id.split('-')[0]}</p>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4 pb-4">
                                    <div className="space-y-3 pb-4 border-b">
                                        {order.items.length > 0 ? order.items.map((item, i) => (
                                            <div key={item.id || i} className="flex gap-3">
                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                                    {item.dosage && <p className="text-xs text-muted-foreground">{item.dosage}</p>}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                                    <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">Fórmula Personalizada</p>
                                                    <p className="text-xs text-muted-foreground">Orçamento sob medida</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2 text-sm pb-4 border-b">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Subtotal</span>
                                            <span className="text-foreground">{formatCurrency(order.totalValue)}</span>
                                        </div>
                                        <div className="flex justify-between text-muted-foreground">
                                            <span>Frete</span>
                                            <span className={(effectiveShippingValue === 0 || deliveryMethod === 'PICKUP' || order.shippingType === 'FREE' || order.shippingType === 'DYNAMIC') ? "font-medium text-primary-600" : "text-foreground"}>
                                                {deliveryMethod === 'PICKUP' ? 'Retirada Grátis' :
                                                    order.shippingType === 'FREE' ? 'Grátis' :
                                                        (order.shippingType === 'DYNAMIC' && effectiveShippingValue === 0) ? (
                                                            <span className="text-amber-500">A ser calculado</span>
                                                        ) : (
                                                            formatCurrency(effectiveShippingValue)
                                                        )}
                                            </span>
                                        </div>
                                        {order.discountValue > 0 && (
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Desconto</span>
                                                <span className="text-primary-600">-{formatCurrency(order.discountValue)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex justify-between items-end">
                                        <span className="font-bold text-base">Total</span>
                                        <div className="text-right">
                                            <div className="font-black text-2xl">{formatCurrency(total)}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                ou 6x de {formatCurrency(installmentValue)} s/ juros
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full bg-white border-t border-border py-4 mt-auto">
                <div className="max-w-5xl mx-auto px-4 text-center text-[11px] text-muted-foreground leading-relaxed">
                    Salgado e Campos LTDA • CNPJ 18.338.132/0001-93
                    <br />
                    Rua Américo Totti, 1106, Centro – Alfenas, MG
                </div>
            </footer>

            {/* Icons mock - FileText definition because importing it causes issues if not added */}
        </div>
    );
}

// Ensure FileText is available for the component
function FileText(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
}

// ─── Payment Result (PIX QR Code or redirect info) ──────────────────

function PaymentResultView({ result, total, order }: { result: PaymentResult; total: number; order: CheckoutOrder }) {
    // Para PIX: assim que o QR Code for exibido, ficamos checando o status
    // do pedido periodicamente. Quando o webhook marcar como PAID, redirecionamos
    // automaticamente para a página de sucesso com dados do pedido.
    useEffect(() => {
        if (!result.qrCode) return;

        let active = true;
        const interval = setInterval(async () => {
            try {
                const refreshed = await checkoutService.getOrder(order.id);
                if (!active) return;
                if (refreshed.status === 'PAID') {
                    clearInterval(interval);
                    window.location.href = `/checkout/${order.id}/success`;
                }
            } catch {
                // silencioso
            }
        }, 5000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [result.qrCode, order.id]);
    const copyQrCode = () => {
        if (result.qrCode) {
            navigator.clipboard.writeText(result.qrCode);
            toast.success('Código PIX copiado!');
        }
    };

    if (result.qrCode) {
        return (
            <div className="text-center space-y-6 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10">
                    <QrCode className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Pague via PIX</h2>
                    <p className="text-muted-foreground mt-2">Abra o app do seu banco e escaneie o QR Code ou copie o código Pix Copia e Cola.</p>
                </div>

                {result.qrCodeBase64 && (
                    <div className="inline-block p-4 bg-white rounded-xl border border-border mt-4">
                        <img src={result.qrCodeBase64.startsWith('data:') ? result.qrCodeBase64 : `data:image/png;base64,${result.qrCodeBase64}`} alt="QR Code PIX" className="w-64 h-64 mx-auto" />
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm font-medium">Pix Copia e Cola</p>
                    <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground break-all font-mono">
                        {result.qrCode}
                    </div>
                    <Button onClick={copyQrCode} className="w-full bg-primary-500 hover:bg-primary-600 text-white" size="lg">
                        <Copy className="w-4 h-4 mr-2" /> Copiar Código
                    </Button>
                </div>

                <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-800 border border-primary-200">
                    Valor a pagar: <strong>{formatCurrency(total)}</strong><br />
                    Aprovação instantânea.
                </div>
            </div>
        );
    }

    if (result.billingUrl) {
        return (
            <div className="text-center space-y-6 max-w-md mx-auto py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/10">
                    <CreditCard className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Pagamento Seguro AbacatePay</h2>
                    <p className="text-muted-foreground mt-2">Você será redirecionado para concluir o pagamento com segurança.</p>
                </div>
                <Button
                    onClick={() => window.open(result.billingUrl, '_blank')}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                    size="lg"
                >
                    Concluir Pagamento Seguro <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        );
    }

    return <p className="text-center text-muted-foreground">{result.message}</p>;
}

// ─── Success View ───────────────────────────────────────────────────

function SuccessView({ order }: { order: CheckoutOrder }) {
    const total = order.totalValue + (order.shippingValue || 0) - (order.discountValue || 0);

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <Card className="max-w-md w-full text-center shadow-lg border-primary-200">
                <CardContent className="p-6 space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/10">
                        <Check className="w-10 h-10 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Pagamento Confirmado!</h2>
                        <p className="text-muted-foreground mt-2">
                            Obrigado, <strong>{order.customer?.name}</strong>. Seu pedido está sendo preparado.
                        </p>
                    </div>
                    <Separator />
                    <div className="text-sm space-y-3 bg-muted p-4 rounded-lg">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Pedido</span>
                            <span className="font-bold">#{order.id.slice(-6)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total pago</span>
                            <span className="font-bold text-primary-700">{formatCurrency(total)}</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Você receberá atualizações no seu e-mail e WhatsApp.</p>
                </CardContent>
            </Card>
        </div>
    );
}
