import React, { useState, useEffect } from 'react';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { NewLinkForm } from '../components/NewLinkForm';
import { orderService } from '../src/services/order.service';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Order } from '../src/types/order.types';
import { StatusFilter } from '../components/StatusFilter';
import { OrderTable } from '../components/OrderTable';

export const Links: React.FC = () => {
  const [linksData, setLinksData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, canceled: 0, paidToday: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [rangeFilter, setRangeFilter] = useState('30'); // Default 30 days

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Selected Order for Details
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Modal States
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [orderToAnnotate, setOrderToAnnotate] = useState<any | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, statusFilter]);

  // Fetch Orders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await orderService.list({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === 'Todos' ? undefined : statusFilter,
        search: searchTerm // Add search param
      });
      setLinksData(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await orderService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  /*
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [currentPage, statusFilter]);
  */
  // We need to fetch stats once on mount or occasionally
  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenNoteModal = (order: any) => {
    setOrderToAnnotate(order);
    setCurrentNote('');
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!orderToAnnotate || !currentNote.trim()) return;

    try {
      await orderService.addNote(orderToAnnotate.id, currentNote);
      toast.success('Nota adicionada com sucesso!');
      setIsNoteModalOpen(false);
      setCurrentNote('');
      // Optionally refresh orders to show new note count if we had that in the list
      // fetchOrders(); 
    } catch (error) {
      console.error('Failed to add note', error);
      toast.error('Erro ao adicionar nota.');
    }
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
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Links Gerados</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie e acompanhe o status dos seus links de pagamento.</p>
          </div>
          <button
            onClick={() => setIsNewLinkModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-[#10d641] text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm shadow-green-500/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Novo Link</span>
          </button>
        </div>

        {/* Stats Cards (Mocked for now) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-slate-900 dark:text-white">pending_actions</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Pendente</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-primary">payments</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pagos Hoje</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(stats.paidToday)}</p>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-red-500">cancel</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cancelados</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.canceled}</p>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Buscar por cliente, pedido ou valor..."
              type="text"
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

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value)}
                className="appearance-none w-full md:w-auto pl-10 pr-8 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="15">Últimos 15 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 3 meses</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500">calendar_today</span>
              </div>
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-500 text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          <StatusFilter
            filter={statusFilter}
            onChange={setStatusFilter}
            className="hidden md:flex border-l border-slate-200 dark:border-slate-700 pl-4"
          />
        </div>

        {/* Links Table */}
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
          <OrderTable
            orders={linksData}
            loading={loading}
            onView={(order) => setSelectedOrder(order)}
            onAddNote={(order) => handleOpenNoteModal(order)}
          />

          {/* Pagination */}
          <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando página <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> de <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Previous</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-colors ${currentPage === idx + 1
                        ? 'z-10 bg-primary/20 border-primary/30 text-green-800 dark:text-green-100'
                        : 'border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Next</span>
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />

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
                  fetchOrders(); // Refresh list
                }}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Nota */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsNoteModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">sticky_note_2</span>
                Adicionar Nota
              </h3>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Pedido: {orderToAnnotate?.id.slice(0, 8)}</p>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                className="w-full h-32 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder="Digite sua observação aqui..."
                autoFocus
              ></textarea>
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsNoteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button onClick={handleSaveNote} className="px-4 py-2 text-sm font-bold text-black bg-primary hover:bg-primary-dark rounded-lg transition-colors">Salvar Nota</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};