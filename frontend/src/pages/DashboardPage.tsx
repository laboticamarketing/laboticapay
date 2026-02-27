import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { orderService } from '@/services/order.service';
import { dashboardService, DashboardStats } from '@/services/dashboard.service';
import { authService } from '@/services/auth.service';
import { Order } from '@/types/order.types';
import {
    Plus, Search, X, ChevronLeft, ChevronRight, Eye, TrendingUp,
    ArrowRight, DollarSign, Clock, Wallet, ShoppingBag, CalendarDays,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';

const PERIOD_OPTIONS = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: 'month', label: 'Este mês' },
] as const;

function getPeriodDates(key: string): { startDate: string; endDate: string } {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    switch (key) {
        case 'today': { const d = now.toISOString().slice(0, 10); return { startDate: d, endDate: d }; }
        case '7d': { const s = new Date(now); s.setDate(s.getDate() - 6); return { startDate: s.toISOString().slice(0, 10), endDate: end }; }
        case '30d': { const s = new Date(now); s.setDate(s.getDate() - 29); return { startDate: s.toISOString().slice(0, 10), endDate: end }; }
        case 'month': { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { startDate: s.toISOString().slice(0, 10), endDate: end }; }
        default: return { startDate: '', endDate: '' };
    }
}

const OrderDetailDialog = lazy(() => import('@/components/OrderDetailDialog'));

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PAID: { label: 'Confirmado', variant: 'default' },
    PENDING: { label: 'Pendente', variant: 'secondary' },
    CANCELED: { label: 'Cancelado', variant: 'destructive' },
    EXPIRED: { label: 'Expirado', variant: 'outline' },
};

const FILTER_OPTIONS = [
    { key: 'Todos', label: 'Todos' },
    { key: 'PENDING', label: 'Pendentes' },
    { key: 'PAID', label: 'Confirmados' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card p-3 rounded-lg shadow-lg border border-border min-w-[140px]">
            <p className="text-muted-foreground text-xs font-medium mb-1">{label}</p>
            <p className="text-foreground text-lg font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
            </p>
        </div>
    );
};

export default function DashboardPage() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [period, setPeriod] = useState('month');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        authService.getProfile().then((u) => setUserName(u.name?.split(' ')[0] || '')).catch(() => { });
    }, []);

    useEffect(() => {
        const t = setTimeout(() => fetchData(), 400);
        return () => clearTimeout(t);
    }, [searchTerm, currentPage, statusFilter, period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const dates = getPeriodDates(period);
            const [ordersRes, statsRes] = await Promise.all([
                orderService.list({ page: currentPage, limit: 5, status: statusFilter === 'Todos' ? undefined : statusFilter, search: searchTerm || undefined }),
                dashboardService.getStats(dates.startDate ? dates : undefined),
            ]);
            setOrders(ordersRes.data);
            setTotalPages(ordersRes.meta.totalPages);
            setStats(statsRes);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
        }
    };

    const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const fmtDate = (d: string) => {
        const date = new Date(d);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ', ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const averageTicket =
        stats && stats.paidCountMonth > 0
            ? stats.monthlyRevenue / stats.paidCountMonth
            : 0;

    const statCards = [
        { label: 'Vendas Hoje', value: stats ? fmt(stats.salesToday) : '...', icon: DollarSign, color: 'text-success-500 bg-success-500/10' },
        { label: 'Aguardando Pagamento', value: stats ? `${stats.pendingOrders} Links` : '...', sub: stats?.expiringToday ? `${stats.expiringToday} vencem hoje` : undefined, icon: Clock, color: 'text-warning-500 bg-warning-500/10' },
        { label: 'Total Recebido (Período)', value: stats ? fmt(stats.monthlyRevenue) : '...', icon: Wallet, color: 'text-primary-500 bg-primary-500/10' },
        { label: 'Ticket Médio', value: stats ? fmt(averageTicket) : '...', icon: CalendarDays, color: 'text-indigo-500 bg-indigo-500/10' },
    ];

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-4 border-b border-border/40">
                    <div>
                        <h1 className="text-foreground text-3xl font-bold tracking-tight">
                            Olá, {userName || 'Farmacêutico'} 👋
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">
                            Acompanhe suas vendas e gerencie seus links de pagamento.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                        onClick={() => navigate('/admin/new-link')}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        <span className="font-bold text-base">Novo Link</span>
                    </Button>
                </div>

                {/* Filter and Overview section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        Visão Geral
                    </h2>
                    <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.key}
                                onClick={() => setPeriod(opt.key)}
                                className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${period === opt.key
                                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {statCards.map((card) => (
                        <Card key={card.label}>
                            <CardContent className="px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground text-sm font-medium">
                                            {card.label}
                                        </span>
                                        <p className="text-foreground text-2xl font-bold leading-tight">
                                            {card.value}
                                        </p>
                                        {card.sub && (
                                            <p className="text-muted-foreground text-xs">
                                                {card.sub}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`p-2 rounded-lg ${card.color}`}>
                                        <card.icon className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Desempenho Semanal</CardTitle>
                            <p className="text-muted-foreground text-sm">Volume de vendas nos últimos 7 dias</p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.chartData || []}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-neutral-400)' }} dy={10} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" fill="oklch(0.45 0.18 15)" radius={[4, 4, 0, 0]} barSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                            <ShoppingBag className="w-8 h-8 text-primary-400 mb-3" />
                            <span className="text-4xl font-bold text-foreground">{stats?.paidCountMonth || 0}</span>
                            <span className="text-sm text-muted-foreground mt-1">Pedidos Pagos no Mês</span>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Table */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Últimos Links Gerados</CardTitle>
                            <button onClick={() => navigate('/admin/orders')} className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1 transition-colors">
                                Ver todos <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Buscar cliente (Nome ou CPF)..."
                                    className="pl-9 pr-8"
                                />
                                {searchTerm && (
                                    <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1.5">
                                {FILTER_OPTIONS.map(({ key, label }) => (
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

                        {/* Table */}
                        <div className="overflow-x-auto -mx-6">
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
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i}><td colSpan={6} className="px-6 py-4"><div className="h-8 bg-muted animate-pulse rounded" /></td></tr>
                                        ))
                                    ) : orders.length === 0 ? (
                                        <tr><td colSpan={6}>
                                            <EmptyState icon={ShoppingBag} title="Nenhum resultado encontrado" description="Tente alterar os filtros ou criar um novo link." />
                                        </td></tr>
                                    ) : orders.map((order) => (
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
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-muted-foreground">
                                Página <strong className="text-foreground">{currentPage}</strong> de <strong className="text-foreground">{totalPages}</strong>
                            </span>
                            <div className="flex gap-1.5">
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedOrder && (
                <Suspense fallback={null}>
                    <OrderDetailDialog order={selectedOrder} isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} onOrderUpdated={fetchData} />
                </Suspense>
            )}
        </>
    );
}
