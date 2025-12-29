import React from 'react';
import { Order } from '../src/types/order.types';

interface OrderTableProps {
    orders: Order[];
    loading: boolean;
    onView: (order: Order) => void;
    onAddNote?: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, loading, onView, onAddNote }) => {
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
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-black/20">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pedido</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-surface-light dark:bg-surface-dark">
                    {loading ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center">
                                <div className="flex justify-center items-center gap-2 text-slate-500">
                                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                    <span>Carregando pedidos...</span>
                                </div>
                            </td>
                        </tr>
                    ) : orders.length > 0 ? (
                        orders.map((order) => {
                            const statusColor = getStatusColor(order.status);
                            const displayDate = formatDate(order.createdAt);
                            const displayTime = formatTime(order.createdAt);

                            return (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs mr-3">
                                                {order.customer?.name.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{order.customer?.name || 'Cliente'}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{order.customer?.phone || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                        #{order.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(Number(order.totalValue))}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-600 dark:text-slate-300">{displayDate}</div>
                                        <div className="text-xs text-slate-400">{displayTime}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/30 dark:text-${statusColor}-400`}>
                                            <span className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-500 mr-1.5`}></span>
                                            {order.status === 'PENDING' ? 'Pendente' : order.status === 'PAID' ? 'Confirmado' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            {onAddNote && (
                                                <button
                                                    onClick={() => onAddNote(order)}
                                                    className="p-1.5 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                                                    title="Adicionar Nota"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">chat</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onView(order)}
                                                className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400 transition-colors"
                                                title="Ver Detalhes"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                                <p>Nenhum link encontrado.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
