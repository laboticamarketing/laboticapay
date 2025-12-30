import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
// import { Customer, Order, OrderItem } from '../types';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { api } from '../src/lib/api';

interface OrderItem {
    id: string;
    name: string;
    dosage?: string;
    actives?: string[];
}

interface Order {
    id: string;
    createdAt: string;
    totalValue: string; // or number, Prisma Decimal usually comes as string in JSON or need parsing
    shippingValue?: string;
    status: string;
    attachmentUrl?: string;
    items: OrderItem[];
    notes?: any[];
}

interface Address {
    id: string;
    type: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
    complement?: string;
    isPrimary: boolean;
}

interface Customer {
    id: string;
    name: string;
    email?: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
    addresses?: Address[];
    addresses?: Address[];
    orders: Order[];
    notes?: string; // Legacy notes
    customerNotes?: {
        id: string;
        content: string;
        createdAt: string;
        author?: { name: string };
    }[];
    createdBy?: {
        id: string;
        name: string;
    };
}

export const CustomerProfile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Note State
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);

    useEffect(() => {
        const fetchCustomer = async () => {
            try {
                if (!id) return;
                const response = await api.get(`/customers/${id}`);
                setCustomer(response.data);
            } catch (err) {
                console.error('Failed to fetch customer', err);

                toast.error('Erro ao carregar cliente.');
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id, navigate]);

    if (loading) {
        return <div className="p-8 text-center">Carregando perfil...</div>;
    }

    if (!customer) {
        return <div className="p-8 text-center">Cliente não encontrado.</div>;
    }

    // Process Orders for History Table
    const orderHistory = customer.orders.map(order => {
        const total = parseFloat(order.totalValue.toString()) + (order.shippingValue ? parseFloat(order.shippingValue.toString()) : 0);

        let statusLabel = order.status;
        let color = 'gray';

        if (order.status === 'PENDING') { statusLabel = 'Pendente'; color = 'amber'; }
        if (order.status === 'PAID') { statusLabel = 'Pago'; color = 'green'; }
        if (order.status === 'CANCELED') { statusLabel = 'Cancelado'; color = 'red'; } // Fixed 'red' mapping

        const itemsSummary = order.items.map(i => i.name).join(', ').substring(0, 30) + (order.items.length > 1 ? '...' : '');

        return {
            id: order.id,
            displayId: `#${order.id.substring(0, 8).toUpperCase()} `,
            date: new Date(order.createdAt).toLocaleDateString('pt-BR'),
            fullDate: order.createdAt,
            val: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total),
            status: statusLabel,
            rawStatus: order.status,
            items: itemsSummary || 'Sem itens',
            color,
            // Original object for modal
            original: order
        };
    });

    // Stats Logic
    const totalSpent = customer.orders.reduce((acc, order) => {
        return acc + parseFloat(order.totalValue.toString()) + (order.shippingValue ? parseFloat(order.shippingValue.toString()) : 0);
    }, 0);
    const orderCount = customer.orders.length;
    const avgTicket = orderCount > 0 ? totalSpent / orderCount : 0;

    // Pagination Logic
    const totalPages = Math.ceil(orderHistory.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = orderHistory.slice(indexOfFirstItem, indexOfLastItem);

    const handleOpenOrder = (historyItem: any) => {
        setSelectedOrder({
            ...historyItem.original,
            name: customer.name,
            phone: customer.phone,
            time: new Date(historyItem.fullDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            customer: customer // Pass full customer object if needed
        });
    };

    const handleWhatsAppClick = () => {
        const cleanNumber = customer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanNumber}`, '_blank');
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !customer) return;

        try {
            setSubmittingNote(true);
            const response = await api.post(`/customers/${customer.id}/notes`, { content: newNote });

            // Optimistic update or refetch
            const savedNote = response.data;
            // Assuming response returns the note with author populated or we mock it for now until reload
            // Ideally we just reload the customer data or prepend to list

            // Reload customer to get full data with relationships if needed, or simple prepend
            const responseCust = await api.get(`/customers/${customer.id}`);
            setCustomer(responseCust.data);

            setNewNote('');
            toast.success('Nota adicionada!');
        } catch (error) {
            console.error('Error adding note', error);
            toast.error('Erro ao adicionar nota');
        } finally {
            setSubmittingNote(false);
        }
    };

    const birthDateFormatted = customer.birthDate
        ? new Date(customer.birthDate).toLocaleDateString('pt-BR')
        : 'N/A';

    const age = customer.birthDate
        ? Math.floor((new Date().getTime() - new Date(customer.birthDate).getTime()) / 31557600000)
        : null;

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6 pb-20 animate-in fade-in duration-500">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                <button onClick={() => navigate(-1)} className="hover:text-primary flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Voltar
                </button>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-slate-900 dark:text-white font-medium">Perfil do Cliente</span>
            </div>

            {/* Header Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 w-full">
                    <div className="relative group">
                        <div className="size-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500 ring-4 ring-white dark:ring-surface-dark shadow-lg">
                            {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <button
                            onClick={() => navigate('/customer-edit/' + customer.id)}
                            className="absolute bottom-0 right-0 p-1.5 bg-primary text-slate-900 rounded-full shadow-md hover:scale-110 transition-transform"
                            title="Editar foto"
                        >
                            <span className="material-symbols-outlined text-[16px] block">edit</span>
                        </button>
                    </div>

                    <div className="text-center md:text-left flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900">
                                Ativo
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="material-symbols-outlined text-[18px]">mail</span>
                                {customer.email || 'Sem email'}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="material-symbols-outlined text-[18px]">call</span>
                                {customer.phone}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="material-symbols-outlined text-[18px]">cake</span>
                                {birthDateFormatted} {age !== null ? `(${age} anos)` : ''}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="material-symbols-outlined text-[18px]">badge</span>
                                {customer.cpf || 'CPF não informado'}
                            </div>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="material-symbols-outlined text-[18px]">face</span>
                                {customer.createdBy ? (
                                    <span className="text-slate-600 dark:text-slate-300">
                                        Criado por: <span className="font-bold">{customer.createdBy.name}</span>
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic">Criado pelo Sistema</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleWhatsAppClick}
                        className="flex-1 md:flex-none px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        WhatsApp
                    </button>
                    <button
                        onClick={() => navigate('/customer-edit/' + customer.id)}
                        className="flex-1 md:flex-none px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Editar
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Gasto</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                        </p>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pedidos Realizados</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{orderCount}</p>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-2xl">analytics</span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ticket Médio</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgTicket)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Orders) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-black/20">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">history</span>
                                Histórico de Pedidos
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline">Ver Todos</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase text-slate-400 font-semibold bg-white dark:bg-surface-dark">
                                        <th className="px-5 py-3">ID Pedido</th>
                                        <th className="px-5 py-3">Data</th>
                                        <th className="px-5 py-3">Itens</th>
                                        <th className="px-5 py-3">Valor</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {currentItems.length > 0 ? currentItems.map((order, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{order.displayId}</td>
                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{order.date}</td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{order.items}</td>
                                            <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{order.val}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-${order.color}-100 text-${order.color}-700 dark:bg-${order.color}-900/30 dark:text-${order.color}-400`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => handleOpenOrder(order)}
                                                    className="text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Nenhum pedido encontrado.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="bg-white dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Total de <span className="font-bold text-slate-900 dark:text-white">{orderHistory.length}</span> itens
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
                                            disabled={currentPage === totalPages || totalPages === 0}
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

                {/* Right Column (Info + Notes) */}
                <div className="space-y-6">
                    {/* Notes Section */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-amber-500">sticky_note_2</span>
                            <h3 className="font-bold text-slate-900 dark:text-white">Observações</h3>
                        </div>

                        {/* Legacy Note (Read-only if exists) */}
                        {customer.notes && (
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">Nota da Ficha (Legado)</span>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{customer.notes}</p>
                            </div>
                        )}

                        {/* Timeline */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 pr-1">
                            {customer.customerNotes && customer.customerNotes.length > 0 ? (
                                customer.customerNotes.map((note) => (
                                    <div key={note.id} className="p-3 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                {note.author?.name ? `Atendente (${note.author.name})` : 'Atendente'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(note.createdAt).toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{note.content}</p>
                                    </div>
                                ))
                            ) : (
                                !customer.notes && <p className="text-sm text-slate-400 italic text-center py-2">Nenhuma observação.</p>
                            )}
                        </div>

                        {/* Add Note */}
                        <form onSubmit={handleAddNote} className="relative">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Nova observação..."
                                className="w-full text-sm p-3 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
                            ></textarea>
                            <button
                                type="submit"
                                disabled={submittingNote || !newNote.trim()}
                                className="absolute bottom-2 right-2 p-1.5 bg-primary text-slate-900 rounded-lg shadow-sm hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                title="Adicionar nota"
                            >
                                <span className="material-symbols-outlined text-[18px]">send</span>
                            </button>
                        </form>
                    </div>

                    {/* Addresses */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500">location_on</span>
                                Endereços
                            </h3>
                            <button onClick={() => navigate('/customer-edit/' + customer.id)} className="p-1 text-slate-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(() => {
                                // Find the first (newest) address marked as primary
                                const activePrimaryId = customer.addresses?.find(a => a.isPrimary)?.id;

                                return customer.addresses && customer.addresses.length > 0 ? (
                                    customer.addresses.map((addr, index) => (
                                        <div key={addr.id} className="relative p-4 rounded-lg border border-primary/30 bg-primary/5">
                                            {addr.id === activePrimaryId && (
                                                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-primary bg-white dark:bg-surface-dark px-2 py-0.5 rounded-full border border-primary/20 shadow-sm">Principal</span>
                                            )}
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{addr.type}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ''}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                                            <p className="text-xs text-slate-400 mt-2">CEP: {addr.zip}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Nenhum endereço cadastrado.</p>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <OrderDetailsModal
                isOpen={!!selectedOrder}
                onClose={() => setSelectedOrder(null)}
                order={selectedOrder}
            />
        </div >
    );
};