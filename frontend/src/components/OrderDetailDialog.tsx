import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { orderService } from '@/services/order.service';
import { Order } from '@/types/order.types';
import {
    Package, MapPin, DollarSign, MessageSquare, Clock,
    Copy, Check, Send, Plus, User, Truck, FileText,
    XCircle, CheckCircle2, AlertCircle, Ban, Loader2, Eye, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onOrderUpdated?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PAID: { label: 'Confirmado', icon: CheckCircle2, variant: 'default' },
    PENDING: { label: 'Pendente', icon: AlertCircle, variant: 'secondary' },
    CANCELED: { label: 'Cancelado', icon: XCircle, variant: 'destructive' },
    EXPIRED: { label: 'Expirado', icon: Clock, variant: 'outline' },
};

export default function OrderDetailDialog({ order: initialOrder, isOpen, onClose, onOrderUpdated }: Props) {
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order>(initialOrder);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [sending, setSending] = useState(false);
    const [canceling, setCanceling] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [copied, setCopied] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);

    // Fetch full order details when dialog opens
    useEffect(() => {
        if (isOpen && initialOrder?.id) {
            setLoadingDetails(true);
            orderService.getDetails(initialOrder.id)
                .then((fullOrder) => {
                    setOrder(fullOrder);
                    setNotes(fullOrder.notes || []);
                })
                .catch(() => {
                    // Fallback to partial data
                    setOrder(initialOrder);
                    setNotes(initialOrder.notes || []);
                })
                .finally(() => setLoadingDetails(false));
        }
    }, [isOpen, initialOrder?.id]);

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const link = `${window.location.origin}/checkout/${order.id}`;
    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = status.icon;

    const subtotal = Number(order.totalValue) || 0;
    const shipping = Number(order.shippingValue) || 0;
    const discountVal = Number(order.discountValue) || 0;
    const discount = order.discountType === 'PERCENTAGE' ? (subtotal * discountVal) / 100 : discountVal;
    const total = subtotal - discount + shipping;

    const handleCopy = () => {
        navigator.clipboard?.writeText(link);
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyField = (text: string | null | undefined, label: string) => {
        if (!text || text === '-') return;
        navigator.clipboard?.writeText(text);
        toast.success(`${label} copiado!`);
    };

    const handleWhatsApp = () => {
        const phone = order.customer?.phone?.replace(/\D/g, '');
        if (!phone) { toast.error('Cliente sem telefone.'); return; }
        const msg = encodeURIComponent(`Olá ${order.customer?.name || ''}!\n\n🔗 Link de pagamento: ${link}\n💰 Valor: ${fmt(total)}`);
        window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setSending(true);
        try {
            await orderService.addNote(order.id, newNote);
            setNotes([...notes, { content: newNote, createdAt: new Date().toISOString(), authorType: 'ATTENDANT' }]);
            setNewNote('');
            toast.success('Nota adicionada!');
        } catch {
            toast.error('Erro ao adicionar nota.');
        } finally { setSending(false); }
    };

    const handleCancel = async () => {
        setCanceling(true);
        try {
            await orderService.cancel(order.id);
            toast.success('Pedido cancelado com sucesso!');
            setConfirmCancel(false);
            onOrderUpdated?.();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Erro ao cancelar pedido.');
        } finally { setCanceling(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto p-0">
                {/* Header */}
                <DialogHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</DialogTitle>
                            <DialogDescription>
                                {fmtDate(order.createdAt)}
                                {(order as any).user && <> · Atendente: <strong>{(order as any).user.name}</strong></>}
                            </DialogDescription>
                        </div>
                        <Badge variant={status.variant} className="gap-1.5 px-3 py-1">
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                        </Badge>
                    </div>
                </DialogHeader>

                {loadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-6">
                        {/* LEFT COLUMN */}
                        <div className="space-y-6">
                            {/* Link Actions */}
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
                                    {copied ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Link</>}
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={handleWhatsApp}>
                                    <Send className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                                </Button>
                                {order.status === 'PENDING' && (
                                    <Button variant="outline" size="sm" className="text-error-500 hover:bg-error-500/10 border-error-200" onClick={() => setConfirmCancel(true)}>
                                        <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancelar
                                    </Button>
                                )}
                            </div>

                            {/* Cancel Confirmation */}
                            {confirmCancel && (
                                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                                    <p className="text-sm text-error-700 font-medium mb-3">Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.</p>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" size="sm" onClick={() => setConfirmCancel(false)}>Voltar</Button>
                                        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={canceling}>
                                            {canceling ? 'Cancelando...' : 'Sim, Cancelar Pedido'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Customer */}
                            <Card>
                                <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-border/40">
                                    <CardTitle className="text-sm flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary-500" /> Dados do Cliente
                                        </div>
                                        <span className="text-[10px] font-normal text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-primary-500 transition-colors" onClick={() => {
                                            const customerId = order.customer?.id || order.customerId;
                                            if (customerId) {
                                                onClose();
                                                navigate(`/customer-profile/${customerId}`);
                                            }
                                        }}>
                                            Ver Perfil <Eye className="w-3 h-3" />
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 pt-4">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(order.customer?.name, 'Nome')}>
                                            <div>
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Nome Completo</p>
                                                <p className="text-sm font-medium text-foreground">{order.customer?.name || '-'}</p>
                                            </div>
                                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                        </div>
                                        <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(order.customer?.cpf, 'CPF')}>
                                            <div>
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">CPF</p>
                                                <p className="text-sm font-medium text-foreground">{order.customer?.cpf || '-'}</p>
                                            </div>
                                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                        </div>
                                        <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors col-span-2 sm:col-span-1" onClick={() => handleCopyField(order.customer?.email, 'E-mail')}>
                                            <div className="min-w-0 pr-2">
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">E-mail</p>
                                                <p className="text-sm font-medium text-foreground truncate">{order.customer?.email || '-'}</p>
                                            </div>
                                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                                        </div>
                                        <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(order.customer?.phone, 'Telefone')}>
                                            <div>
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Telefone</p>
                                                <p className="text-sm font-medium text-foreground">{order.customer?.phone || '-'}</p>
                                            </div>
                                            <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Items */}
                            <Card>
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5 text-primary-500" /> Itens do Pedido {order.items?.length > 0 ? `(${order.items.length})` : ''}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-3">
                                    {(!order.items || order.items.length === 0) ? (
                                        <div className="p-4 rounded-xl border border-dashed border-border text-center">
                                            <p className="text-muted-foreground text-sm">Nenhum item encontrado.</p>
                                        </div>
                                    ) : (
                                        order.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0 last:pb-0">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-foreground">{item.name}</p>
                                                    {item.dosage && <p className="text-xs text-muted-foreground">Dosagem: {item.dosage}</p>}
                                                    {item.actives && (item.actives as string[]).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(item.actives as string[]).map((a: string, i: number) => (
                                                                <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {item.price && <p className="text-sm font-bold text-foreground shrink-0">{fmt(Number(item.price))}</p>}
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div> {/* End Left Column */}

                        {/* RIGHT COLUMN */}
                        <div className="space-y-6">

                            {/* Address */}
                            <Card className="border-border">
                                <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-border/40">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary-500" /> Endereço de Entrega
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 pt-4">
                                    {(() => {
                                        const address = order.customer?.addresses?.[0];
                                        if (!address) {
                                            return (
                                                <div className="bg-muted/50 rounded-lg p-6 border border-border text-center flex flex-col items-center gap-2">
                                                    <span className="material-symbols-outlined text-3xl text-primary-500"><Package className="w-6 h-6" /></span>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">Retirada na Loja</p>
                                                        <p className="text-xs text-muted-foreground mt-1">O cliente optou por retirar o pedido no balcão.</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const isMotoboy = ['Alfenas', 'Poços de Caldas', 'Machado'].some(city =>
                                            address.city?.toLowerCase().includes(city.toLowerCase())
                                        );

                                        return (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {isMotoboy ? (
                                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase gap-1 bg-primary-50 text-primary-700">
                                                            <Truck className="w-3 h-3" /> Entrega Local (Motoboy)
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] font-bold uppercase gap-1">
                                                            <Truck className="w-3 h-3" /> Envio via Transportadora
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                                    <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors col-span-2" onClick={() => handleCopyField(`${address.street}, ${address.number}`, 'Logradouro')}>
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Logradouro</p>
                                                            <p className="text-sm font-medium text-foreground">{address.street}, {address.number}</p>
                                                        </div>
                                                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                    </div>

                                                    <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(address.complement, 'Complemento')}>
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Complemento</p>
                                                            <p className="text-xs font-medium text-foreground">{address.complement || '-'}</p>
                                                        </div>
                                                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                    </div>

                                                    <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(address.neighborhood, 'Bairro')}>
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Bairro</p>
                                                            <p className="text-xs font-medium text-foreground">{address.neighborhood || '-'}</p>
                                                        </div>
                                                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                    </div>

                                                    <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(`${address.city} - ${address.state}`, 'Cidade/UF')}>
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Cidade/UF</p>
                                                            <p className="text-xs font-medium text-foreground">{address.city} - {address.state}</p>
                                                        </div>
                                                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                    </div>

                                                    <div className="group flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1.5 -m-1.5 rounded transition-colors" onClick={() => handleCopyField(address.zip, 'CEP')}>
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">CEP</p>
                                                            <p className="text-xs font-medium text-foreground">{address.zip}</p>
                                                        </div>
                                                        <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Payment Summary */}
                            <Card>
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <DollarSign className="w-3.5 h-3.5 text-primary-500" /> Resumo Financeiro
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-1.5 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium text-foreground">{fmt(subtotal)}</span></div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-success-500">
                                            <span>Desconto {order.discountType === 'PERCENTAGE' ? `(${discountVal}%)` : ''}</span>
                                            <span>- {fmt(discount)}</span>
                                        </div>
                                    )}
                                    {shipping > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Frete ({order.shippingType === 'FREE' ? 'Grátis' : 'Fixo'})</span>
                                            <span className="text-foreground">+ {fmt(shipping)}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between font-bold text-foreground pt-1">
                                        <span>Total</span>
                                        <span className="text-primary-500 text-base">{fmt(total)}</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Método de Pagamento</p>
                                            <div className="flex flex-col gap-1 text-xs font-medium text-foreground">
                                                {order.transactions && order.transactions.length > 0 ? (
                                                    order.transactions.map((t: any, idx: number) => {
                                                        const type = (t.type || '').toUpperCase();
                                                        const isPix = type === 'PIX';
                                                        const isCard = type === 'CARD';
                                                        const last4 = t.metadata?.card?.last4;
                                                        const installments = t.metadata?.card?.installments || 1;

                                                        return (
                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                {isPix ? (
                                                                    <img
                                                                        src="/icons/checkout/payments/pix.svg"
                                                                        alt="Pix"
                                                                        className="h-4 w-auto"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                                                        <span>
                                                                            Cartão de crédito
                                                                            {last4 && ` • final ${last4}`}
                                                                            {installments > 1 && ` • ${installments}x`}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] text-muted-foreground">Nenhum pagamento registrado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Data do Pagamento</p>
                                            <p className="text-xs font-medium text-foreground">
                                                {order.status === 'PAID' ? fmtDate(order.updatedAt) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notes */}
                            <Card>
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5 text-primary-500" /> Observações ({notes.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-3">
                                    {notes.length === 0 && <p className="text-xs text-muted-foreground py-2">Nenhuma observação.</p>}
                                    {notes.map((note: any, idx: number) => (
                                        <div key={idx} className="bg-muted rounded-lg p-3">
                                            <p className="text-sm text-foreground">{note.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {note.authorType === 'CUSTOMER' ? '👤 Cliente' : '🏥 Atendente'} · {fmtDate(note.createdAt)}
                                            </p>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <Input placeholder="Adicionar nota..." value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
                                        <Button variant="outline" size="icon" onClick={handleAddNote} disabled={sending || !newNote.trim()}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Timeline */}
                            {order.transactions && order.transactions.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2 pt-4 px-4">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-primary-500" /> Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        <div className="space-y-3">
                                            {order.transactions.map((t: any, idx: number) => (
                                                <div key={idx} className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.status === 'CONFIRMED' ? 'bg-success-500' : t.status === 'FAILED' ? 'bg-error-500' : 'bg-warning-500'}`} />
                                                    <div>
                                                        <p className="text-sm text-foreground">
                                                            <span className="font-medium">{t.type}</span> — {t.status === 'CONFIRMED' ? 'Confirmado' : t.status === 'FAILED' ? 'Falhou' : 'Pendente'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{fmtDate(t.createdAt)} · {fmt(Number(t.amount))}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div> {/* End Right Column */}

                    </div>
                )
                }
            </DialogContent >
        </Dialog >
    );
}
