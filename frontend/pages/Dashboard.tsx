import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { NewLinkForm } from '../components/NewLinkForm';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { StatusFilter } from '../components/StatusFilter';
import { OrderTable } from '../components/OrderTable';
import { orderService } from '../src/services/order.service';
import { dashboardService, DashboardStats } from '../src/services/dashboard.service';
import { Order } from '../src/types/order.types';
import { authService } from '../src/services/auth.service';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 min-w-[140px] transform transition-all">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1.5">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-8 rounded-full bg-primary/20 relative overflow-hidden">
            <span className="absolute bottom-0 left-0 w-full bg-primary" style={{ height: '60%' }}></span>
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Vendas</p>
            <p className="text-slate-900 dark:text-white text-lg font-black tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [rangeFilter, setRangeFilter] = useState('30'); // Days
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getProfile();
        setUserName(user.name.split(' ')[0]);
      } catch (error) {
        console.error('Failed to fetch user', error);
      }
    };
    fetchUser();
  }, []);

  // Data State
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, statusFilter]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        orderService.list({
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter === 'Todos' ? undefined : statusFilter,
          search: searchTerm
        }),
        dashboardService.getStats()
      ]);

      setRecentOrders(ordersRes.data);
      setTotalPages(ordersRes.meta.totalPages);
      setStats(statsRes);

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  // Helper to map backend status to UI colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green';
      case 'PENDING': return 'amber';
      case 'CANCELED': return 'slate';
      case 'EXPIRED': return 'red';
      default: return 'slate';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ', ' + new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">Olá, {userName || 'Farmacêutico'} 👋</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Acompanhe suas vendas e gerencie seus links de pagamento.</p>
          </div>
          <button
            onClick={() => setIsNewLinkModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark text-black font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Novo Link</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Vendas Hoje</p>
              <span className="material-symbols-outlined text-green-600 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-md text-sm">payments</span>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">
              {stats ? formatCurrency(stats.salesToday) : '...'}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aguardando Pagamento</p>
              <span className="material-symbols-outlined text-amber-600 bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-md text-sm">hourglass_top</span>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">
              {stats ? `${stats.pendingOrders} Links` : '...'}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">
              {stats ? `${stats.expiringToday} vencem hoje` : '...'}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Recebido (Mês)</p>
              <span className="material-symbols-outlined text-blue-600 bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-md text-sm">account_balance_wallet</span>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold mt-1">
              {stats ? formatCurrency(stats.monthlyRevenue) : '...'}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 flex flex-col rounded-xl bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-slate-900 dark:text-white text-lg font-bold">Desempenho Semanal</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Volume de vendas nos últimos 7 dias</p>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData || []}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#13ec49"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                    className="hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="h-full">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm h-full flex flex-col justify-between">
              <div className="mb-4">
                <p className="text-slate-900 dark:text-white font-bold mb-1">Pagamentos no Mês</p>
              </div>

              <div className="flex-1 flex items-center justify-center my-4 flex-col">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats?.paidCountMonth || 0}</span>
                <span className="text-sm text-slate-500">Pedidos Pagos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[400px]">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Últimos Links Gerados</h3>
              <button onClick={() => navigate('/links')} className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1 transition-colors">
                Ver todos
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset page on search
                  }}
                  placeholder="Buscar cliente (Nome ou CPF)..."
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-lg py-2 pl-9 pr-8 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-1 focus:ring-primary"
                />

                {/* Clear Search Button */}
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <StatusFilter
                  filter={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
          </div>

          <OrderTable
            orders={recentOrders}
            loading={loading}
            onView={handleViewOrder}
          />

          {/* Dashboard Pagination Footer */}
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-black/10">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Link */}
      {isNewLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsNewLinkModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white hidden">Novo Link</h2>
                <button onClick={() => setIsNewLinkModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 z-10">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <NewLinkForm
                onCancel={() => setIsNewLinkModalOpen(false)}
                onSuccess={() => {
                  setIsNewLinkModalOpen(false);
                  fetchData(); // Refresh dashboard
                }}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isDetailsModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      )}
    </>
  );
};