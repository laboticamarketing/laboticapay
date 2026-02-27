import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { customerService } from '@/services/customer.service';
import { Customer, CustomerNote, Address } from '@/types/customer.types';
import { Order } from '@/types/order.types';
import { maskPhone, maskCPF, validatePhone, maskCEP } from '@/lib/validation';
import EmptyState from '@/components/EmptyState';
import {
    ArrowLeft, Mail, Phone, CreditCard, Calendar, UserCheck,
    DollarSign, ShoppingBag, Receipt, Eye, Send, Plus,
    Pencil, MapPin, MessageSquare, ChevronLeft, ChevronRight, Trash2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PAID: { label: 'Pago', variant: 'default' },
    PENDING: { label: 'Pendente', variant: 'secondary' },
    CANCELED: { label: 'Cancelado', variant: 'destructive' },
    EXPIRED: { label: 'Expirado', variant: 'outline' },
};

export default function CustomerDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [sendingNote, setSendingNote] = useState(false);
    const [orderPage, setOrderPage] = useState(1);
    const ordersPerPage = 5;

    // Edit form state
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', cpf: '' });
    const [saving, setSaving] = useState(false);

    // Address form state
    const [addressOpen, setAddressOpen] = useState(false);
    const [addressForm, setAddressForm] = useState({ id: '', zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', type: 'Casa', noNumber: false });
    const [savingAddress, setSavingAddress] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    const fetchCustomer = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await customerService.getById(id);
            setCustomer(data);
        } catch {
            toast.error('Erro ao carregar cliente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCustomer(); }, [id]);

    // Computed stats
    const stats = useMemo(() => {
        if (!customer?.orders) return { totalSpent: 0, totalOrders: 0, avgTicket: 0 };
        const paidOrders = customer.orders.filter((o: Order) => o.status === 'PAID');
        const totalSpent = paidOrders.reduce((acc: number, o: Order) => acc + Number(o.totalValue), 0);
        return {
            totalSpent,
            totalOrders: paidOrders.length,
            avgTicket: paidOrders.length > 0 ? totalSpent / paidOrders.length : 0,
        };
    }, [customer]);

    // Paginated orders
    const paginatedOrders = useMemo(() => {
        if (!customer?.orders) return { items: [] as Order[], total: 0, totalPages: 0 };
        const total = customer.orders.length;
        const totalPages = Math.ceil(total / ordersPerPage);
        const items = customer.orders.slice((orderPage - 1) * ordersPerPage, orderPage * ordersPerPage);
        return { items, total, totalPages };
    }, [customer, orderPage]);

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const openEdit = () => {
        if (!customer) return;
        setEditForm({ name: customer.name, email: customer.email || '', phone: maskPhone(customer.phone || ''), cpf: customer.cpf ? maskCPF(customer.cpf) : '' });
        setEditOpen(true);
    };

    const handleSave = async () => {
        if (!customer || !id) return;
        if (!validatePhone(editForm.phone)) {
            toast.error('Telefone/WhatsApp inválido.');
            return;
        }
        setSaving(true);
        try {
            await customerService.update(id, {
                name: editForm.name,
                email: editForm.email || undefined,
                phone: editForm.phone,
                cpf: editForm.cpf || undefined,
            });
            toast.success('Cliente atualizado!');
            setEditOpen(false);
            fetchCustomer();
        } catch {
            toast.error('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const fetchCep = async (value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length !== 8) return;
        setLoadingCep(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setAddressForm(f => ({
                    ...f,
                    street: data.logradouro || '',
                    neighborhood: data.bairro || '',
                    city: data.localidade || '',
                    state: data.uf || ''
                }));
            } else {
                toast.error('CEP não encontrado.');
            }
        } catch {
            toast.error('Erro ao buscar CEP.');
        } finally {
            setLoadingCep(false);
        }
    };

    const handleAddAddress = async () => {
        if (!customer || !id) return;
        if (!addressForm.zip || !addressForm.street || (!addressForm.number && !addressForm.noNumber) || !addressForm.neighborhood || !addressForm.city || !addressForm.state) {
            toast.error('Preencha os campos obrigatórios do endereço.');
            return;
        }

        setSavingAddress(true);
        try {
            const currentAddresses = customer.addresses || [];

            let updatedAddresses;
            if (addressForm.id) {
                updatedAddresses = currentAddresses.map(a => a.id === addressForm.id ? { ...addressForm, number: addressForm.noNumber ? 'SN' : addressForm.number, type: addressForm.type || 'Casa' } : a);
            } else {
                updatedAddresses = [...currentAddresses, {
                    ...addressForm,
                    number: addressForm.noNumber ? 'SN' : addressForm.number,
                    type: addressForm.type || 'Casa'
                }];
            }

            await customerService.update(id, {
                addresses: updatedAddresses
            });
            toast.success(addressForm.id ? 'Endereço atualizado!' : 'Endereço adicionado com sucesso!');
            setAddressOpen(false);
            setAddressForm({ id: '', zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', type: 'Casa', noNumber: false });
            fetchCustomer();
        } catch {
            toast.error('Erro ao salvar endereço.');
        } finally {
            setSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (addressId?: string) => {
        if (!customer || !id || !addressId) return;
        if (!window.confirm('Tem certeza que deseja excluir este endereço?')) return;

        try {
            const updatedAddresses = (customer.addresses || []).filter(a => a.id !== addressId);
            await customerService.update(id, { addresses: updatedAddresses });
            toast.success('Endereço excluído!');
            fetchCustomer();
        } catch {
            toast.error('Erro ao excluir endereço.');
        }
    };

    const openEditAddress = (addr: Address) => {
        setAddressForm({
            id: addr.id || '',
            zip: addr.zip,
            street: addr.street,
            number: addr.number === 'SN' ? '' : addr.number,
            noNumber: addr.number === 'SN',
            complement: addr.complement || '',
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            type: addr.type || 'Casa'
        });
        setAddressOpen(true);
    };

    const handleAddNote = async () => {
        if (!id || !newNote.trim()) return;
        setSendingNote(true);
        try {
            await customerService.addNote(id, newNote.trim());
            setNewNote('');
            toast.success('Observação adicionada!');
            fetchCustomer();
        } catch {
            toast.error('Erro ao adicionar observação.');
        } finally {
            setSendingNote(false);
        }
    };

    const handleWhatsApp = () => {
        if (!customer?.phone) return;
        const phone = customer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phone}`, '_blank');
    };

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <Card><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-5"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/customers')}>
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
                </Button>
                <EmptyState icon={UserCheck} title="Cliente não encontrado" description="O cliente pode ter sido removido." />
            </div>
        );
    }

    const initials = customer.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6">
            {/* Back */}
            <button onClick={() => navigate('/admin/customers')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar
                <Separator orientation="vertical" className="h-4 mx-1" />
                <span className="font-medium text-foreground">Perfil do Cliente</span>
            </button>

            {/* Header Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xl shrink-0">
                                {initials}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
                                    <Badge variant="secondary" className="text-[10px]">
                                        Criado em {fmtDate(customer.createdAt)}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email || 'Sem email'}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone || 'N/A'}</span>
                                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{customer.cpf ? maskCPF(customer.cpf) : 'CPF não informado'}</span>
                                    {customer.createdBy && (
                                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />Criado por: {customer.createdBy.name}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button variant="outline" size="sm" onClick={handleWhatsApp} disabled={!customer.phone}>
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                            </Button>
                            <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={openEdit}>
                                <Pencil className="w-3.5 h-3.5 mr-1.5" /> Editar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Gasto', value: fmt(stats.totalSpent), icon: DollarSign, color: 'text-primary-500 bg-primary-500/10' },
                    { label: 'Pedidos Realizados', value: stats.totalOrders, icon: ShoppingBag, color: 'text-success-500 bg-success-500/10' },
                    { label: 'Ticket Médio', value: fmt(stats.avgTicket), icon: Receipt, color: 'text-warning-500 bg-warning-500/10' },
                ].map(card => (
                    <Card key={card.label}>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                                <p className="text-xl font-bold text-foreground">{card.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Grid: Orders (left) + Notes & Addresses (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Orders Table */}
                <Card className="lg:col-span-3">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-primary-500" /> Histórico de Pedidos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border">
                                        {['ID PEDIDO', 'DATA', 'ITENS', 'VALOR', 'STATUS', ''].map(h => (
                                            <th key={h} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedOrders.items.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">Nenhum pedido encontrado.</td></tr>
                                    ) : paginatedOrders.items.map((order: Order) => (
                                        <tr key={order.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">#{order.id.slice(0, 8)}</td>
                                            <td className="px-4 py-2.5 text-xs text-muted-foreground">{fmtDate(order.createdAt)}</td>
                                            <td className="px-4 py-2.5 text-xs text-foreground">{order.items?.length || 0}</td>
                                            <td className="px-4 py-2.5 text-xs font-bold text-foreground">{fmt(Number(order.totalValue))}</td>
                                            <td className="px-4 py-2.5">
                                                <Badge variant={STATUS_MAP[order.status]?.variant || 'outline'} className="text-[10px]">
                                                    {STATUS_MAP[order.status]?.label || order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/orders`)}>
                                                    <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                            <span className="text-[10px] text-muted-foreground">Total de <strong className="text-foreground">{paginatedOrders.total}</strong> itens</span>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={orderPage <= 1} onClick={() => setOrderPage((p: number) => p - 1)}>
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                </Button>
                                <span className="flex items-center px-2 text-xs text-muted-foreground">{orderPage}</span>
                                <Button variant="outline" size="icon" className="h-7 w-7" disabled={orderPage >= paginatedOrders.totalPages} onClick={() => setOrderPage((p: number) => p + 1)}>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes + Addresses */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Notes */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-warning-500" /> Observações
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(!customer.customerNotes || customer.customerNotes.length === 0) && (
                                <p className="text-xs text-muted-foreground italic">Nenhuma observação.</p>
                            )}
                            {customer.customerNotes?.map((note: CustomerNote) => (
                                <div key={note.id} className="bg-muted/50 rounded-md p-3">
                                    <p className="text-sm text-foreground">{note.content}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {note.author?.name || 'Sistema'} · {fmtDate(note.createdAt)}
                                    </p>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input
                                    value={newNote}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
                                    placeholder="Nova observação..."
                                    className="text-sm"
                                    onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddNote()}
                                />
                                <Button size="icon" className="bg-success-500 hover:bg-success-600 text-white shrink-0 h-9 w-9" onClick={handleAddNote} disabled={sendingNote || !newNote.trim()}>
                                    <Send className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Addresses */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-error-500" /> Endereços
                                </CardTitle>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                    setAddressForm({ id: '', zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', type: 'Casa', noNumber: false });
                                    setAddressOpen(true);
                                }}>
                                    <Plus className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {(!customer.addresses || customer.addresses.length === 0) ? (
                                <p className="text-xs text-muted-foreground italic">Nenhum endereço cadastrado.</p>
                            ) : customer.addresses.map((addr: Address, i: number) => (
                                <div key={addr.id || i} className="bg-muted/50 rounded-md p-3 mb-2 last:mb-0 border border-success-200">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                            {addr.type || 'Casa'}
                                            {addr.isPrimary && <Badge variant="secondary" className="text-[10px]">Principal</Badge>}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => openEditAddress(addr)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDeleteAddress(addr.id)}>
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-foreground">{addr.street}, {addr.number}</p>
                                    <p className="text-xs text-muted-foreground">{addr.neighborhood} — {addr.city}/{addr.state}</p>
                                    {addr.complement && <p className="text-xs text-muted-foreground">Complemento: {addr.complement}</p>}
                                    <p className="text-xs text-muted-foreground mt-1">CEP: {addr.zip}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-medium">Nome</Label>
                            <Input value={editForm.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Email</Label>
                            <Input value={editForm.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Telefone</Label>
                            <Input value={editForm.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} maxLength={15} />
                        </div>
                        <div>
                            <Label className="text-xs font-medium">CPF</Label>
                            <Input value={editForm.cpf} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm(f => ({ ...f, cpf: maskCPF(e.target.value) }))} maxLength={14} />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                            <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Address Dialog */}
            <Dialog open={addressOpen} onOpenChange={setAddressOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{addressForm.id ? 'Editar Endereço' : 'Adicionar Endereço'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <Label className="text-xs font-medium flex items-center justify-between">
                                    <span>CEP *</span>
                                    {loadingCep && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                                </Label>
                                <Input
                                    value={addressForm.zip}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        const val = maskCEP(e.target.value);
                                        setAddressForm(f => ({ ...f, zip: val }));
                                        if (val.replace(/\D/g, '').length === 8) fetchCep(val);
                                    }}
                                    maxLength={9}
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label className="text-xs font-medium">Tipo (Casa, Trabalho) *</Label>
                                <Input value={addressForm.type} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, type: e.target.value }))} />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs font-medium">Rua / Logradouro *</Label>
                                <Input value={addressForm.street} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, street: e.target.value }))} />
                            </div>
                            <div className="col-span-2 sm:col-span-1 border border-border rounded-md p-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium">Número *</Label>
                                    <Input
                                        value={addressForm.noNumber ? 'SN' : addressForm.number}
                                        disabled={addressForm.noNumber}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setAddressForm(f => ({ ...f, number: val }));
                                        }}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Checkbox id="noNumber" checked={addressForm.noNumber} onCheckedChange={(checked) => setAddressForm(f => ({ ...f, noNumber: checked === true }))} />
                                    <label htmlFor="noNumber" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Sem número
                                    </label>
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label className="text-xs font-medium">Complemento</Label>
                                <Input value={addressForm.complement} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, complement: e.target.value }))} />
                            </div>
                            <div className="col-span-2">
                                <Label className="text-xs font-medium">Bairro *</Label>
                                <Input value={addressForm.neighborhood} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, neighborhood: e.target.value }))} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label className="text-xs font-medium">Cidade *</Label>
                                <Input value={addressForm.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, city: e.target.value }))} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label className="text-xs font-medium">Estado *</Label>
                                <Input value={addressForm.state} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressForm(f => ({ ...f, state: e.target.value }))} maxLength={2} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setAddressOpen(false)}>Cancelar</Button>
                            <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={handleAddAddress} disabled={savingAddress || loadingCep}>
                                {savingAddress ? (addressForm.id ? 'Salvando...' : 'Adicionando...') : (addressForm.id ? 'Salvar' : 'Adicionar')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
