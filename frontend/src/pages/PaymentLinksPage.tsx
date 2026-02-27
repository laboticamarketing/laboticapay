import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { orderService } from '@/services/order.service';
import { Order } from '@/types/order.types';
import {
    Plus, Search, X, ChevronLeft, ChevronRight, Eye,
    Clock, DollarSign, XCircle, Calendar, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const OrderDetailDialog = lazy(() => import('@/components/OrderDetailDialog'));

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PAID: { label: 'Confirmado', variant: 'default' },
    PENDING: { label: 'Pendente', variant: 'secondary' },
    CANCELED: { label: 'Cancelado', variant: 'destructive' },
    EXPIRED: { label: 'Expirado', variant: 'outline' },
};

const FILTERS = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'PAID', label: 'Confirmados' },
    { key: 'CANCELED', label: 'Cancelados' },
];

export default function PaymentLinksPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ pending: 0, paidToday: 0, canceled: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        orderService.getStats().then(setStats).catch(() => { });
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchOrders(), 400);
        return () => clearTimeout(t);
    }, [searchTerm, currentPage, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderService.list({
                page: currentPage,
                limit: 10,
                status: statusFilter === 'ALL' ? undefined : statusFilter,
                search: searchTerm || undefined,
            });
            setOrders(res.data);
            setTotalPages(res.meta.totalPages);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    };

    const handleExportCsv = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);
            const baseURL = api.defaults.baseURL || '';
            const url = `${baseURL}/orders/export?${params.toString()}`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
            toast.success('CSV exportado com sucesso!');
        } catch {
            toast.error('Erro ao exportar CSV.');
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const statCards = [
        { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-warning-500 bg-warning-500/10' },
        { label: 'Pagos Hoje', value: fmt(stats.paidToday), icon: DollarSign, color: 'text-success-500 bg-success-500/10' },
        { label: 'Cancelados', value: stats.canceled, icon: XCircle, color: 'text-error-500 bg-error-500/10' },
    ];

    return (
        <>
            <div className="space-y-6">
                {/* Heading */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
                        <p className="text-muted-foreground text-sm mt-1">Gerencie e acompanhe o status dos seus pedidos.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExportCsv}>
                            <Download className="w-4 h-4 mr-2" /> Exportar CSV
                        </Button>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white" onClick={() => navigate('/admin/new-link')}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Link
                        </Button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statCards.map((card) => (
                        <Card key={card.label}>
                            <CardContent className="p-5 flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">{card.label}</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                                </div>
                                <div className={`p-2.5 rounded-lg ${card.color}`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-3 items-center">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Buscar por cliente, pedido ou valor..."
                                    className="pl-9 pr-8"
                                />
                                {searchTerm && (
                                    <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                {FILTERS.map(({ key, label }) => (
                                    <Button
                                        key={key}
                                        variant={statusFilter === key ? 'default' : 'outline'}
                                        size="sm"
                                        className={statusFilter === key ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''}
                                        onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-border">
                                        {['CLIENTE', 'PEDIDO', 'VALOR', 'DATA', 'STATUS', ''].map((h) => (
                                            <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-3">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-8 bg-muted animate-pulse rounded" /></td></tr>
                                        ))
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-16">
                                                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                                <p className="text-muted-foreground text-sm font-medium">Nenhum pedido encontrado</p>
                                                <p className="text-muted-foreground/60 text-xs mt-1">Tente alterar os filtros ou criar um novo link.</p>
                                            </td>
                                        </tr>
                                    ) : orders.map((order: Order) => (
                                        <tr key={order.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {order.customer?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="font-medium text-sm text-foreground">{order.customer?.name || 'Anônimo'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-muted-foreground font-mono">#{order.id.slice(0, 8)}</td>
                                            <td className="px-6 py-3.5 text-sm font-bold text-foreground">{fmt(order.totalValue)}</td>
                                            <td className="px-6 py-3.5 text-sm text-muted-foreground">{fmtDate(order.createdAt)}</td>
                                            <td className="px-6 py-3.5">
                                                <Badge variant={STATUS_MAP[order.status]?.variant || 'outline'}>
                                                    {STATUS_MAP[order.status]?.label || order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">
                                    Página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong>
                                </span>
                                <div className="flex gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p: number) => p - 1)}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon" className={`h-8 w-8 ${currentPage === page ? 'bg-primary-500 text-white' : ''}`} onClick={() => setCurrentPage(page)}>
                                                {page}
                                            </Button>
                                        );
                                    })}
                                    <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p: number) => p + 1)}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {selectedOrder && (
                <Suspense fallback={null}>
                    <OrderDetailDialog order={selectedOrder} isOpen={!!selectedOrder} onClose={() => { setSelectedOrder(null); fetchOrders(); }} onOrderUpdated={fetchOrders} />
                </Suspense>
            )}
        </>
    );
}
