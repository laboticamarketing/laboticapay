import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { customerService } from '../src/services/customer.service';
import { orderService } from '../src/services/order.service';
import { CreateOrderDTO } from '../src/types/order.types';
import { Customer } from '../src/types/customer.types';
import { validateCpf } from '../src/lib/validation';

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return Number(value.replace(/\D/g, '')) / 100;
};

type ShippingType = 'dynamic' | 'fixed' | 'free';

interface Formula {
  id: string;
  name: string;
  dosage: string;
  actives: string[];
  currentActiveInput: string;
  price?: string; // NEW
}

const maskCurrency = (value: string) => {
  let v = value.replace(/\D/g, '');
  if (!v) return '';
  return (parseInt(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

interface NewLinkFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  isModal?: boolean;
}

export const NewLinkForm: React.FC<NewLinkFormProps> = ({ onCancel, onSuccess, isModal = false }) => {
  const [shippingType, setShippingType] = useState<ShippingType>('fixed');

  // State for Customer
  const [customerMode, setCustomerMode] = useState<'search' | 'new'>('search');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // State for Customer Search Results
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const filteredCustomers = searchResults;

  // State for New Customer Inputs
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', cpf: '' });

  // State for Values
  const [totalValue, setTotalValue] = useState('');
  const [shippingValue, setShippingValue] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [internalNotes, setInternalNotes] = useState('');

  // State for Loading/Draft


  // State for Success View
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<{
    customer?: string;
    value?: string;
    shipping?: string; // Added separate error key for shipping
    formulas?: string;
  }>({});

  // State for multiple formulas
  const [formulas, setFormulas] = useState<Formula[]>([
    { id: '1', name: '', dosage: '', actives: [], currentActiveInput: '', price: '' }
  ]);

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setErrors(prev => ({ ...prev, customer: undefined }));
  }

  // Handlers for Formula Management
  const addFormula = () => {
    setFormulas([
      ...formulas,
      { id: Date.now().toString(), name: '', dosage: '', actives: [], currentActiveInput: '', price: '' }
    ]);
  };

  const removeFormula = (id: string) => {
    if (formulas.length === 1) return; // Prevent removing the last one
    setFormulas(formulas.filter(f => f.id !== id));
  };

  const updateFormulaField = (id: string, field: keyof Formula, value: string) => {
    setFormulas(formulas.map(f => f.id === id ? { ...f, [field]: value } : f));
    if (field === 'name') setErrors(prev => ({ ...prev, formulas: undefined }));
  };

  // Handlers for Actives (Ingredients)
  const addActive = (id: string) => {
    const formula = formulas.find(f => f.id === id);
    if (!formula || !formula.currentActiveInput.trim()) return;

    setFormulas(formulas.map(f => {
      if (f.id === id) {
        return {
          ...f,
          actives: [...f.actives, f.currentActiveInput.trim()],
          currentActiveInput: ''
        };
      }
      return f;
    }));
  };

  const removeActive = (formulaId: string, indexToRemove: number) => {
    setFormulas(formulas.map(f => {
      if (f.id === formulaId) {
        return {
          ...f,
          actives: f.actives.filter((_, idx) => idx !== indexToRemove)
        };
      }
      return f;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, formulaId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addActive(formulaId);
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!totalValue) newErrors.value = 'Informe o valor total.';

    if (shippingType === 'fixed' && !shippingValue) {
      newErrors.shipping = 'Informe o valor do frete fixo.';
    }

    if (customerMode === 'new') {
      if (newCustomerData.cpf && !validateCpf(newCustomerData.cpf)) {
        newErrors.customer = 'CPF inválido.';
        toast.error('CPF inválido');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to scroll to error
  const scrollToError = (errors: any) => {
    if (errors.customer) {
      document.getElementById('card-customer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.value) {
      document.getElementById('input-value')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.shipping) {
      document.getElementById('input-shipping')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (errors.formulas) {
      document.getElementById('card-formulas')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Customer Search Logic ---
  React.useEffect(() => {
    if (customerSearch.length < 3) {
      setSearchResults([]);
      return;
    }

    const fetchCustomers = async () => {
      setIsSearchingCustomer(true);
      try {
        const { data } = await customerService.list({ search: customerSearch });
        setSearchResults(data);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao buscar clientes. Verifique se o servidor está rodando.');
      } finally {
        setIsSearchingCustomer(false);
      }
    };

    const delay = setTimeout(fetchCustomers, 500);
    return () => clearTimeout(delay);
  }, [customerSearch]);


  const handleGenerateLink = async () => {
    if (!validateForm()) {
      const currentErrors: any = {};
      if (!totalValue) currentErrors.value = true;
      if (shippingType === 'fixed' && !shippingValue) currentErrors.shipping = true;

      scrollToError(currentErrors);
      return;
    }

    try {
      const payload: CreateOrderDTO = {
        totalValue: parseCurrency(totalValue),
        shippingValue: shippingType === 'fixed' ? parseCurrency(shippingValue) : undefined,
        shippingType: shippingType.toUpperCase() as any, // DYNAMIC, FIXED, FREE
        discountValue: discountValue ? (discountType === 'fixed' ? parseCurrency(discountValue) : Number(discountValue.replace(/\D/g, ''))) : undefined,
        discountType: discountValue ? discountType.toUpperCase() as any : undefined,
        internalNotes: internalNotes || undefined,
        items: formulas.map(f => ({
          name: f.name || `Fórmula ${f.actives.length > 0 ? f.actives[0] : ''}`,
          dosage: f.dosage,
          actives: f.actives,
          price: f.price ? parseCurrency(f.price) : undefined
        })),
        customerId: customerMode === 'search' && selectedCustomer ? selectedCustomer.id : undefined,
        newCustomer: customerMode === 'new' ? {
          name: newCustomerData.name,
          phone: newCustomerData.phone,
          cpf: newCustomerData.cpf,
          email: '' // Add field if needed
        } : undefined
      };

      const newOrder = await orderService.create(payload);

      // Use the returned payment link
      const link = newOrder.paymentLink?.asaasUrl || `${window.location.origin}/checkout/${newOrder.id}`;
      setGeneratedLink(link);
      setIsSuccess(true);

    } catch (error: any) {
      console.error('Error creating order:', error);
      if (error.response?.status === 409) {
        toast.error('CPF já cadastrado. Selecione o cliente na busca.');
        setErrors(prev => ({ ...prev, customer: 'CPF já em uso' }));
      } else {
        toast.error('Erro ao criar pedido e gerar link. Verifique o console.');
      }
    }
  };



  const copyToClipboard = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(generatedLink).then(() => {
        setLinkCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setLinkCopied(false), 2000);
      }).catch(() => toast.error('Erro ao copiar'));
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setLinkCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        toast.error('Erro ao copiar link');
      }
      document.body.removeChild(textArea);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setGeneratedLink('');
    setSelectedCustomer(null);
    setNewCustomerData({ name: '', phone: '', cpf: '' });
    setTotalValue('');
    setShippingValue('');
    setDiscountValue('');
    setInternalNotes('');
    setFormulas([{ id: '1', name: '', dosage: '', actives: [], currentActiveInput: '' }]);
    if (onSuccess) onSuccess();
  };

  const getCustomerName = () => selectedCustomer ? selectedCustomer.name : newCustomerData.name;
  const getCustomerPhone = () => selectedCustomer ? selectedCustomer.phone : newCustomerData.phone;

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 shadow-sm">
          <span className="material-symbols-outlined text-[40px]">check</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Link Gerado com Sucesso!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
          O link de pagamento para <strong>{getCustomerName()}</strong> no valor de <strong>{totalValue}</strong> está pronto.
        </p>

        <div className="w-full max-w-md bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-slate-400">link</span>
          <input
            readOnly
            value={generatedLink}
            className="flex-1 bg-transparent border-none text-sm text-slate-600 dark:text-slate-300 focus:ring-0 p-0 truncate"
          />
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${linkCopied ? 'bg-green-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}
          >
            {linkCopied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {(() => {
            const phone = getCustomerPhone();
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            const hasPhone = cleanPhone.length >= 10;

            if (hasPhone) {
              return (
                <button
                  onClick={() => {
                    const message = `Olá ${getCustomerName()}, segue o link para pagamento do seu pedido: ${generatedLink}`;
                    window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                >
                  <span className="material-symbols-outlined">chat</span>
                  Enviar no WhatsApp
                </button>
              );
            }
            return null;
          })()}
          <button
            onClick={resetForm}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      <div className="mb-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-text-main dark:text-white">Novo Link de Pagamento</h2>
          <p className="text-text-secondary dark:text-gray-400 mt-2">Preencha os dados da fórmula para gerar o link.</p>
        </div>
        <div className="flex items-center gap-3">

        </div>
      </div>

      {/* Card 1: Dados do Cliente */}
      <div id="card-customer" className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border ${errors.customer ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-900/50' : 'border-border-color dark:border-slate-800'} p-6 lg:p-8 transition-all`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${errors.customer ? 'text-red-500' : 'text-indigo-500'}`}>person</span>
            <h3 className={`font-bold text-lg ${errors.customer ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>Dados do Cliente</h3>
          </div>
          {selectedCustomer ? (
            <button onClick={() => setSelectedCustomer(null)} className="text-xs text-red-500 hover:underline">Alterar Cliente</button>
          ) : (
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setCustomerMode('search')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${customerMode === 'search' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Buscar
              </button>
              <button
                onClick={() => setCustomerMode('new')}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${customerMode === 'new' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Novo
              </button>
            </div>
          )}
        </div>

        {selectedCustomer ? (
          <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
            <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold">
              {selectedCustomer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCustomer.phone} • {selectedCustomer.cpf}</p>
            </div>
            <span className="ml-auto material-symbols-outlined text-green-500">check_circle</span>
          </div>
        ) : (
          <div className="space-y-4">
            {customerMode === 'search' ? (
              <div className="relative">
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Buscar Cliente</label>
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className={`w-full rounded-lg border bg-background-light dark:bg-background-dark h-11 pl-10 pr-4 text-sm transition-all ${errors.customer ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary'} focus:ring-2 focus:border-transparent`}
                    placeholder="Digite nome ou CPF..."
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                </div>
                {errors.customer && <p className="text-xs text-red-500 mt-1 font-medium">{errors.customer}</p>}

                {/* Search Results Dropdown */}
                {filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                      >
                        <p className="font-medium text-sm text-slate-900 dark:text-white">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.cpf} • {customer.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
                {customerSearch.length > 2 && filteredCustomers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-center">
                    <p className="text-sm text-slate-500">Nenhum cliente encontrado.</p>
                    <button onClick={() => setCustomerMode('new')} className="text-sm text-primary font-bold hover:underline mt-1">Cadastrar novo?</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <input
                    value={newCustomerData.name}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, name: e.target.value });
                      if (errors.customer) setErrors(prev => ({ ...prev, customer: undefined }));
                    }}
                    className={`w-full rounded-lg border bg-background-light dark:bg-background-dark h-11 px-4 text-sm transition-all ${errors.customer ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary'}`}
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">WhatsApp / Telefone</label>
                  <input
                    value={newCustomerData.phone}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, phone: maskPhone(e.target.value) });
                      if (errors.customer) setErrors(prev => ({ ...prev, customer: undefined }));
                    }}
                    maxLength={15}
                    className={`w-full rounded-lg border bg-background-light dark:bg-background-dark h-11 px-4 text-sm transition-all ${errors.customer ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary'}`}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">CPF</label>
                  <input
                    value={newCustomerData.cpf}
                    onChange={(e) => {
                      setNewCustomerData({ ...newCustomerData, cpf: maskCPF(e.target.value) });
                      if (errors.customer) setErrors(prev => ({ ...prev, customer: undefined }));
                    }}
                    maxLength={14}
                    className={`w-full rounded-lg border bg-background-light dark:bg-background-dark h-11 px-4 text-sm transition-all ${errors.customer ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary'}`}
                    placeholder="000.000.000-00"
                  />
                </div>
                {errors.customer && <p className="text-xs text-red-500 font-medium col-span-1 md:col-span-2">{errors.customer}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 2: Valores e Frete (Obrigatório) */}
      <div className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border ${errors.value ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-900/50' : 'border-border-color dark:border-slate-800'} p-6 lg:p-8 transition-all`}>
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <span className={`material-symbols-outlined ${errors.value ? 'text-red-500' : 'text-green-600'}`}>payments</span>
          <h3 className={`font-bold text-lg ${errors.value ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>Valores do Pedido</h3>
        </div>

        <div className="space-y-8">
          {/* Value Input */}
          <div id="input-value">
            <label className="block text-sm font-bold mb-2 text-text-main dark:text-white">Valor Total da Fórmula <span className="text-red-500">*</span></label>
            <div className="relative group">
              <input
                value={totalValue}
                onChange={(e) => {
                  const masked = maskCurrency(e.target.value);
                  setTotalValue(masked);
                  setErrors(prev => ({ ...prev, value: undefined }));
                }}
                className={`w-full h-16 pl-4 pr-4 bg-background-light dark:bg-background-dark border rounded-lg text-3xl font-bold text-text-main dark:text-white placeholder-text-secondary/30 transition-all ${errors.value ? 'border-red-300 focus:ring-red-500' : 'border-border-color dark:border-slate-700 focus:ring-primary'} focus:ring-2 focus:border-transparent`}
                placeholder="R$ 0,00"
                type="text"
              />
            </div>
            {errors.value && <p className="text-xs text-red-500 mt-1 font-medium">{errors.value}</p>}
          </div>

          {/* Discount Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                Desconto <span className="text-xs font-normal text-slate-400 ml-1">(Opcional)</span>
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('fixed');
                    setDiscountValue('');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${discountType === 'fixed' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('percentage');
                    setDiscountValue('');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${discountType === 'percentage' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                >
                  %
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                value={discountValue}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '');
                  if (discountType === 'fixed') {
                    setDiscountValue(maskCurrency(v));
                  } else {
                    // Percentage limit 100
                    if (Number(v) > 100) v = '100';
                    setDiscountValue(v);
                  }
                }}
                className={`w-full h-12 pl-4 pr-12 bg-background-light dark:bg-background-dark border rounded-lg text-lg font-bold text-text-main dark:text-white transition-all border-border-color dark:border-slate-700 focus:ring-primary focus:ring-2 focus:border-transparent`}
                placeholder={discountType === 'fixed' ? "R$ 0,00" : "0%"}
                type="text"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                {discountType === 'fixed' ? '' : '%'}
              </span>
            </div>
          </div>

          {/* Shipping Type Selector */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-sm font-bold mb-3 text-text-main dark:text-white">Tipo de Frete <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShippingType('fixed')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${shippingType === 'fixed' ? 'bg-primary/10 border-primary text-green-800 dark:text-green-400 ring-1 ring-primary' : 'bg-background-light dark:bg-background-dark border-border-color dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined">attach_money</span>
                <span className="font-bold text-sm">Fixo</span>
                <span className="text-[10px] opacity-70">Valor definido agora</span>
              </button>

              <button
                type="button"
                onClick={() => setShippingType('free')}
                className={`p-4 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${shippingType === 'free' ? 'bg-primary/10 border-primary text-green-800 dark:text-green-400 ring-1 ring-primary' : 'bg-background-light dark:bg-background-dark border-border-color dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined">volunteer_activism</span>
                <span className="font-bold text-sm">Grátis</span>
                <span className="text-[10px] opacity-70">Cortesia da farmácia</span>
              </button>
            </div>

            {/* Conditional Fixed Shipping Input */}
            {shippingType === 'fixed' && (
              <div id="input-shipping" className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valor do Frete <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    value={shippingValue}
                    onChange={(e) => {
                      setShippingValue(maskCurrency(e.target.value));
                      if (errors.shipping) setErrors(prev => ({ ...prev, shipping: undefined }));
                    }}
                    className={`w-full h-12 pl-4 pr-4 bg-background-light dark:bg-background-dark border rounded-lg text-lg font-bold text-text-main dark:text-white transition-all ${errors.shipping ? 'border-red-300 focus:ring-red-500' : 'border-border-color dark:border-slate-700 focus:ring-primary'} focus:border-transparent`}
                    placeholder="R$ 0,00"
                    type="text"
                  />
                </div>
                {errors.shipping && <p className="text-xs text-red-500 mt-1 font-medium">{errors.shipping}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Detalhes do Produto/Fórmula (Multi-item support) */}
      <div id="card-formulas" className={`bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border ${errors.formulas ? 'border-red-300 dark:border-red-900 ring-1 ring-red-200 dark:ring-red-900/50' : 'border-border-color dark:border-slate-800'} p-6 lg:p-8 transition-all`}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined ${errors.formulas ? 'text-red-500' : 'text-blue-500'}`}>medication</span>
            <h3 className={`font-bold text-lg ${errors.formulas ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>Dados da Fórmula</h3>
          </div>
          <div className="flex gap-2">

            <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Opcional</span>
          </div>
        </div>

        <div className="space-y-6">
          {formulas.map((formula, index) => (
            <div key={formula.id} className="relative bg-white dark:bg-black/20 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Visual Indicator Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${index % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}></div>

              <div className="p-5 pl-7">
                {/* Formula Header & Delete Button */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${index % 2 === 0 ? 'text-blue-500' : 'text-purple-500'}`}>prescriptions</span>
                    Fórmula {index + 1}
                  </h4>
                  {formulas.length > 1 && (
                    <button
                      onClick={() => removeFormula(formula.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                      title="Remover fórmula"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Name and Price Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                        Nome da Fórmula / Identificação <span className="text-xs font-normal text-slate-400">(Opcional)</span>
                      </label>
                      <input
                        value={formula.name}
                        onChange={(e) => updateFormulaField(formula.id, 'name', e.target.value)}
                        className={`w-full rounded-lg border bg-slate-50 dark:bg-surface-dark h-11 px-4 text-sm transition-all ${errors.formulas && !formula.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary'} focus:ring-2 focus:border-transparent`}
                        placeholder="Ex: Minoxidil 5% + Biotina"
                        type="text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                        Valor Unitário <span className="text-xs font-normal text-slate-400">(Opcional)</span>
                      </label>
                      <input
                        value={formula.price}
                        onChange={(e) => updateFormulaField(formula.id, 'price', maskCurrency(e.target.value))}
                        className="w-full rounded-lg border bg-slate-50 dark:bg-surface-dark h-11 px-4 text-sm border-slate-200 dark:border-slate-700 focus:ring-primary focus:ring-2 focus:border-transparent transition-all"
                        placeholder="R$ 0,00"
                        type="text"
                      />
                    </div>
                  </div>

                  {/* Dynamic Actives Input and Dosage stacked vertically */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Composição / Ativos</label>
                      <div className="relative">
                        <input
                          value={formula.currentActiveInput}
                          onChange={(e) => updateFormulaField(formula.id, 'currentActiveInput', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, formula.id)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark h-11 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Digite e Enter..."
                          type="text"
                        />
                        <button
                          onClick={() => addActive(formula.id)}
                          className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                      </div>

                      {/* Actives List (Tags) */}
                      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 dark:bg-black/10 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                        {formula.actives.length === 0 && (
                          <span className="text-xs text-slate-400 italic py-1 px-1">Nenhum ativo adicionado.</span>
                        )}
                        {formula.actives.map((active, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                            {active}
                            <button
                              onClick={() => removeActive(formula.id, idx)}
                              className="hover:text-red-500 flex items-center justify-center ml-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Dosage - Disabled as per request
                    <div>
                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Posologia / Modo de Uso</label>
                      <textarea
                        value={formula.dosage}
                        onChange={(e) => updateFormulaField(formula.id, 'dosage', e.target.value)}
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-dark p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none h-[116px]"
                        placeholder="Ex: Tomar 1 cápsula ao dia..."
                      ></textarea>
                    </div> 
                    */}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Formula Button */}
          <button
            onClick={addFormula}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Adicionar Outra Fórmula ao Pedido
          </button>
        </div>
        {errors.formulas && <p className="text-center text-sm text-red-500 mt-4 font-medium">{errors.formulas}</p>}
      </div>

      {/* Card 4: Infos Adicionais (Opcional) */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-color dark:border-slate-800 p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">sticky_note_2</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Informações Adicionais</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Observações Internas ou para o Cliente <span className="text-xs font-normal text-slate-400 ml-1">(Opcional)</span>
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none h-20"
              placeholder="Ex: Cliente solicitou entrega pela manhã..."
            ></textarea>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="relative flex items-center">
              <input type="checkbox" id="receipt" defaultChecked className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-background-dark checked:border-primary checked:bg-primary transition-all" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </span>
            </div>
            <label htmlFor="receipt" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              Enviar recibo por e-mail automaticamente após pagamento
            </label>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 pb-12">
        <button
          onClick={onCancel}
          className={`text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${!onCancel ? 'invisible' : ''}`}
        >
          {isModal ? 'Cancelar' : (
            <>
              <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
              Exportar Orçamento
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleGenerateLink}
          className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-primary/90 text-black font-bold text-lg rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">link</span>
          Gerar Link de Pagamento
        </button>
      </div>

    </section>
  );
};