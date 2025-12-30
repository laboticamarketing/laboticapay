import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/lib/api';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // ID is the most important part here
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order: listOrder }) => {
  const navigate = useNavigate();
  const [linkCopied, setLinkCopied] = useState(false);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const fetchDetails = async () => {
    if (!listOrder?.id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/orders/${listOrder.id}`);
      setDetails(data);
    } catch (error) {
      console.error('Falha ao carregar detalhes do pedido', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && listOrder?.id) {
      fetchDetails();
    } else {
      setDetails(null);
    }
  }, [isOpen, listOrder]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !order.id) return;
    setIsAddingNote(true);
    try {
      await api.post(`/orders/${order.id}/notes`, { content: newNote });
      setNewNote('');
      // Refresh details to show new note
      const { data } = await api.get(`/orders/${order.id}`);
      setDetails(data);
    } catch (error) {
      console.error('Erro ao adicionar nota', error);
    } finally {
      setIsAddingNote(false);
    }
  };

  if (!isOpen || !listOrder) return null;

  const handleCopyLink = () => {
    const link = `${window.location.origin}/checkout/${order.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  // Use details if available, otherwise fallback to listOrder or show loading
  const order = details || listOrder;

  // Calculate Totals
  const totalFormula = Number(order.totalValue || 0);
  let discountAmount = 0;
  if (order.discountValue && Number(order.discountValue) > 0) {
    if (order.discountType === 'PERCENTAGE') {
      discountAmount = (totalFormula * Number(order.discountValue)) / 100;
    } else {
      discountAmount = Number(order.discountValue);
    }
  }
  const totalValue = totalFormula - discountAmount + Number(order.shippingValue || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative bg-white dark:bg-surface-dark w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalhes do Pedido</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-slate-500 dark:text-slate-400">ID do Pedido: #{order.id}</p>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Criado em {formatDateTime(order.createdAt)}</p>
              {order.user && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Atendente: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.user.name}</span>
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
              <p>Carregando detalhes...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

            {/* Status Bar */}
            <div className="bg-background-light dark:bg-black/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`size-12 rounded-full flex items-center justify-center ${order.status === 'PAID' ? 'bg-green-100 text-green-600' :
                  order.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                  <span className="material-symbols-outlined icon-filled">
                    {order.status === 'PAID' ? 'check_circle' : order.status === 'PENDING' ? 'hourglass_top' : 'cancel'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Status do Pagamento</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {order.status === 'PENDING' ? 'Pendente' : order.status === 'PAID' ? 'Confirmado' : order.status}
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium">Valor Total</p>
                <p className="text-2xl font-bold text-primary dark:text-primary">{formatCurrency(totalValue)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

              {/* Left Column */}
              <div className="space-y-8">

                {/* Formula / Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-500 icon-filled">medication</span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Itens do Pedido</h3>
                    </div>
                  </div>

                  {details.items && details.items.length > 0 ? (
                    <div className="space-y-4">
                      {details.items.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                              <p className="text-xs text-slate-500">Manipulado</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.price && Number(item.price) > 0
                                  ? formatCurrency(Number(item.price))
                                  : <span className="text-slate-400 font-normal italic">Valor não informado</span>}
                              </p>
                              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 inline-block mt-1">1 un</span>
                            </div>
                          </div>

                          {/* Actives/Composition */}
                          {item.actives && item.actives.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Composição</p>
                              <div className="flex flex-wrap gap-2">
                                {item.actives.map((active: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300">
                                    {active}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dosage */}
                          {item.dosage && (
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Posologia</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{item.dosage}"</p>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-between items-center text-sm px-2">
                        <span className="text-slate-500">Frete ({order.shippingType === 'FREE' ? 'Grátis' : order.shippingType})</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {Number(order.shippingValue) === 0 ? 'Grátis' : formatCurrency(Number(order.shippingValue))}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhum item encontrado.</p>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                {/* Client Data */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 icon-filled">person</span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Dados do Cliente</h3>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        const customerId = order.customer?.id || order.customerId;
                        if (customerId) {
                          navigate(`/customer-profile/${customerId}`);
                        } else {
                          console.error('Customer ID not found');
                        }
                      }}
                      className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                    >
                      Ver Perfil <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nome Completo</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customer?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CPF</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customer?.cpf || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">E-mail</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white break-all">{order.customer?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Telefone</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{order.customer?.phone || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>

                {/* Payment Info */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-500 icon-filled">credit_card</span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Informações de Pagamento</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Resumo Financeiro</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                          <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(totalFormula)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                            <span>Desconto {order.discountType === 'PERCENTAGE' ? `(${order.discountValue}%)` : ''}</span>
                            <span>- {formatCurrency(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Frete</span>
                          <span className="font-medium text-slate-900 dark:text-white">{Number(order.shippingValue) === 0 ? 'Grátis' : formatCurrency(Number(order.shippingValue))}</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-700 my-2 pt-2 flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>Total</span>
                          <span>{formatCurrency(totalValue)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Método</p>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-slate-400">payments</span>
                        Asaas Checkout
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data do Pagamento</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {order.status === 'PAID' ? formatDateTime(order.updatedAt) : '-'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Link de Pagamento</p>
                      <a href={order.paymentLink?.asaasUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all">
                        {order.paymentLink?.asaasUrl || '-'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-6">
                {/* Address Card */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-500 icon-filled">location_on</span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Endereço de Entrega</h3>
                  </div>

                  {(() => {
                    const address = order.customer?.addresses?.[0];

                    if (!address) {
                      return <p className="text-sm text-slate-500 italic px-1">Endereço não informado.</p>;
                    }

                    return (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Logradouro</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {address.street}, {address.number}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Complemento</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{address.complement || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bairro</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{address.neighborhood || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Cidade</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{address.city || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">UF</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{address.state || '-'}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CEP</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{address.zip || '-'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Notes Section */}
                <div className="border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-amber-500 icon-filled">sticky_note_2</span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Observações</h3>
                  </div>
                  <div className="space-y-3">
                    {order.notes && order.notes.length > 0 ? (
                      order.notes.map((note: any, idx: number) => (
                        <div key={idx} className="pt-2 border-t border-amber-200 dark:border-amber-800/30 first:border-0 first:pt-0">
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            "{note.content}"
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-slate-400">{formatDateTime(note.createdAt)}</span>
                            {note.authorType === 'CUSTOMER' ? (
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Cliente</span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Atendente {note.author?.name ? `(${note.author.name.split(' ')[0]})` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">Nenhuma observação.</p>
                    )}
                  </div>

                  {/* Add Note Input */}
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/30">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Adicionar observação interna..."
                        className="flex-1 text-sm bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={isAddingNote || !newNote.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAddingNote ? (
                          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[20px]">send</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-blue-500 icon-filled">history</span>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Linha do Tempo</h3>
                  </div>
                  <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                    {order.status === 'PAID' && (
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-white dark:ring-surface-dark"></div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Pagamento Confirmado</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.updatedAt)}</p>
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-surface-dark"></div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Link Criado</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-background-light dark:bg-black/10 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>ID: {order.id}</span>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {order.status !== 'PAID' && (
              <button
                onClick={handleCopyLink}
                className={`flex-1 sm:flex-none justify-center px-5 py-2.5 rounded-lg border border-transparent text-slate-600 dark:text-slate-300 hover:shadow-sm font-semibold text-sm transition-all flex items-center gap-2 ${linkCopied ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-white dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[20px]">{linkCopied ? 'check' : 'content_copy'}</span>
                {linkCopied ? 'Link Copiado!' : 'Copiar Link'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none justify-center px-6 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};