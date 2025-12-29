
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../src/lib/api';
import { validateCpf } from '../src/lib/validation';
import { CheckoutAddressForm, AddressData } from '../components/CheckoutAddressForm';
import { CheckoutPersonalForm, PersonalData } from '../components/CheckoutPersonalForm';
import { CheckoutExtrasForm, ExtrasData } from '../components/CheckoutExtrasForm';

// --- Types & Context ---
interface OrderDetails {
  id: string;
  addressId?: string; // Correct selected address
  totalValue: number;
  shippingValue: number;
  discountValue?: number;
  discountType?: 'FIXED' | 'PERCENTAGE';
  items: Array<{ name: string; dosage: string; actives?: string, activeList?: string[], price?: string }>;
  customer?: {
    name: string;
    cpf: string;
    phone: string;
    email: string;
    rg?: string;
    birthDate?: string;
    addressZip?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressNeighborhood?: string;
    addressCity?: string;
    addressState?: string;
    addressComplement?: string;
    addresses?: Array<{
      id: string;
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip: string;
      type: string;
      isPrimary: boolean;
    }>;
  };
  paymentLink?: {
    asaasUrl: string;
  };
  notes?: Array<{ content: string }>;
  attachmentUrl?: string;
}

interface CheckoutFormData {
  name: string;
  birthDate: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;

  // Address
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  addressType: string;
  notes: string;
}

interface CheckoutContextType {
  order: OrderDetails | null;
  formData: CheckoutFormData;
  updateFormData: (data: Partial<CheckoutFormData>) => void;
  saveProgress: (overrideData?: Partial<CheckoutFormData>) => Promise<any>;
  loading: boolean;
  submitOrder: () => Promise<void>;
  isProcessing: boolean;
  refreshOrder: () => Promise<void>;
  addresses: Array<any>;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string | null) => void;
  deleteAddress: (addressId: string) => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextType>({} as CheckoutContextType);

const useCheckout = () => useContext(CheckoutContext);



// --- Components ---

const OrderSummaryContent = () => {
  const { order } = useCheckout();

  if (!order) return null;

  const totalFormula = Number(order.totalValue);
  let discountAmount = 0;
  if (order.discountValue && Number(order.discountValue) > 0) {
    if (order.discountType === 'PERCENTAGE') {
      discountAmount = (totalFormula * Number(order.discountValue)) / 100;
    } else {
      discountAmount = Number(order.discountValue);
    }
  }
  const total = totalFormula - discountAmount + Number(order.shippingValue || 0);

  return (
    <>
      <div className="p-5 space-y-4">
        {order.items.map((item, idx) => {
          // Parse actives logic
          let actives: string[] = [];

          if (Array.isArray(item.actives)) {
            actives = item.actives;
          } else if (typeof item.actives === 'string') {
            // Check if it looks like a JSON array
            if (item.actives.startsWith('[')) {
              try { actives = JSON.parse(item.actives); } catch { actives = [item.actives]; }
            } else {
              actives = [item.actives];
            }
          } else if (item.activeList && Array.isArray(item.activeList)) {
            actives = item.activeList;
          }

          let activesDisplay = '';
          if (actives && actives.length > 0) {
            if (actives.length > 3) {
              const remainder = actives.length - 2;
              activesDisplay = actives.slice(0, 2).join(', ') + `, mais ${remainder} ${remainder === 1 ? 'ativo' : 'ativos'} `;
            } else {
              activesDisplay = actives.join(', ');
            }
          }

          return (
            <div key={idx} className="flex gap-3">
              <div className="h-12 w-12 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-xl">medication</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate pr-2">{item.name}</h4>
                  {item.price && (
                    <span className="text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {Number(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  )}
                </div>
                {activesDisplay ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-wrap leading-relaxed">{activesDisplay}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.dosage}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-slate-50/50 dark:bg-white/5">
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Subtotal</span>
          <span>{(Number(order.totalValue)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-medium">
            <span>Desconto {order.discountType === 'PERCENTAGE' ? `(${order.discountValue} %)` : ''}</span>
            <span>- {discountAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>Frete</span>
          <span className={Number(order.shippingValue || 0) === 0 ? 'text-green-600 font-bold' : ''}>
            {Number(order.shippingValue || 0) === 0 ? 'Grátis' : (Number(order.shippingValue || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-3 flex justify-between items-end">
          <span className="font-bold text-slate-900 dark:text-white">Total</span>
          <div className="text-right">
            <span className="block text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">ou 6x de {(total / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} s/ juros</span>
          </div>
        </div>
      </div>
    </>
  );
};

const OrderSummary = () => {
  const { order } = useCheckout();
  if (!order) return null;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-24 hidden lg:block">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20">
        <h3 className="font-bold text-slate-900 dark:text-white">Resumo do Pedido</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pedido #{order.id.slice(0, 8)}</p>
      </div>
      <OrderSummaryContent />
    </div>
  );
};

const MobileOrderSummary = () => {
  const { order } = useCheckout();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!order) return null;
  const total = Number(order.totalValue) + Number(order.shippingValue || 0);

  return (
    <div className="lg:hidden bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">shopping_cart</span>
          <div className="text-left">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Resumo do Pedido</p>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
              <span className="material-symbols-outlined text-[16px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            </p>
          </div>
        </div>
        <p className="font-black text-lg text-slate-900 dark:text-white">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      </button>

      {isExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <OrderSummaryContent />
        </div>
      )}
    </div>
  );
};

// --- Step 1: Informações Pessoais ---
const CheckoutStep1 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, saveProgress, refreshOrder } = useCheckout();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: PersonalData) => {
    setIsSaving(true);
    updateFormData(data);
    try {
      const response = await saveProgress(data);

      if (response && response.customerFound) {
        toast.success(response.message || 'Dados carregados com sucesso!');
        // Refresh full order to get addresses and updated status
        await refreshOrder();
        // Navigate to confirmation (Step 4), skipping other steps
        navigate('confirmation');
      } else {
        navigate('address');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar dados pessoais.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <CheckoutPersonalForm
        initialData={{
          name: formData.name,
          cpf: formData.cpf,
          rg: formData.rg,
          birthDate: formData.birthDate
        }}
        onSubmit={handleSave}
        isSaving={isSaving}
        submitLabel="Ir para Endereço"
      />
    </div>
  );
}

// --- Step 2: Endereço (ViaCEP) ---
const CheckoutStep2 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, saveProgress } = useCheckout();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: AddressData) => {
    setIsSaving(true);
    // Update global context immediately (though stale in this closure, saveProgress will use override)
    updateFormData(data);
    try {
      await saveProgress(data); // Pass data directly to ensure latest is sent
      navigate('../details');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar endereço.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <CheckoutAddressForm
        initialData={{
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          complement: formData.complement,
          addressType: formData.addressType || 'Casa'
        }}
        onSubmit={handleSave}
        isSaving={isSaving}
        submitLabel="Ir para Detalhes"
        showBackButton={true}
        onCancel={() => navigate('../')}
      />
    </div>
  );
};

// --- Step 3: Outros (Contato e Docs) ---
const CheckoutStep3 = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, saveProgress, order, refreshOrder } = useCheckout();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUpload = async (file: File) => {
    if (!order?.id) return false;
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return false;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      await api.post(`/checkout/${order.id}/upload`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSuccess(true);
      await refreshOrder();
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar arquivo.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (data: ExtrasData) => {
    setIsSaving(true);
    updateFormData(data);
    try {
      await saveProgress(data);
      navigate('../confirmation');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar detalhes adicionais.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <CheckoutExtrasForm
        initialData={{
          phone: formData.phone,
          email: formData.email,
          notes: formData.notes,
          attachmentUrl: order?.attachmentUrl
        }}
        onSubmit={handleSave}
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadSuccess={uploadSuccess}
        isSaving={isSaving}
        submitLabel="Revisar Pedido"
        showBackButton={true}
        onCancel={() => navigate('../address')}
      />
    </div>
  );
};

// --- Step 4: Confirmação (Substituiu Pagamento) ---
const CheckoutStepConfirmation = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, saveProgress, submitOrder, isProcessing, order, addresses, selectedAddressId, setSelectedAddressId, refreshOrder, deleteAddress } = useCheckout();

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New states for other inline edits
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // --- Handlers ---

  const handleInlineEdit = (addr?: any) => {
    if (addr) {
      setAddressToEdit({
        cep: addr.zip,
        street: addr.street,
        number: addr.number,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        complement: addr.complement,
        addressType: addr.type
      });
    } else {
      setAddressToEdit({
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: '',
        addressType: 'Casa'
      });
    }
    setIsEditingAddress(true);
  };

  const handleInlineSaveAddress = async (data: AddressData) => {
    setIsSavingAddress(true);
    updateFormData(data);
    try {
      await saveProgress(data);
      await refreshOrder();
      setIsEditingAddress(false);
      setAddressToEdit(null);
      toast.success('Endereço salvo!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar endereço.');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleDeleteClick', id, 'confirm:', confirmDeleteId);
    if (confirmDeleteId === id) {
      await deleteAddress(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  // Personal Data Handler
  const handleSavePerson = async (data: PersonalData) => {
    updateFormData(data);
    try {
      await saveProgress(data);
      setIsEditingPerson(false);
      toast.success('Dados atualizados!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar dados.');
    }
  }

  // Contact/Notes Handler
  const handleSaveExtras = async (data: ExtrasData) => {
    updateFormData(data);
    try {
      await saveProgress(data);
      setIsEditingContact(false);
      setIsEditingNotes(false);
      toast.success('Atualizado com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar.');
    }
  }

  // File Upload
  const handleUpload = async (file: File) => {
    if (!order?.id) return false;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande.');
      return false;
    }
    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    try {
      await api.post(`/checkout/${order.id}/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshOrder();
      return true;
    } catch (e) {
      toast.error('Erro no upload.');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">check_circle</span>
        Confirmar Dados do Pedido
      </h2>

      <div className="space-y-6">
        {/* Personal Info Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg relative transition-all">
          <div className="flex justify-between items-center mb-2">
            {!isEditingPerson && <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dados Pessoais</h3>}
            {!isEditingPerson && <button onClick={() => setIsEditingPerson(true)} className="text-xs text-primary font-bold hover:underline">Editar</button>}
          </div>

          {isEditingPerson ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <CheckoutPersonalForm
                initialData={{ name: formData.name, cpf: formData.cpf, rg: formData.rg, birthDate: formData.birthDate }}
                onSubmit={handleSavePerson}
                onCancel={() => setIsEditingPerson(false)}
                submitLabel="Atualizar Dados"
                showBackButton={true}
                backButtonLabel="Cancelar"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
              <p><span className="font-semibold">Nome:</span> {formData.name}</p>
              <p><span className="font-semibold">CPF:</span> {formData.cpf}</p>
              <p><span className="font-semibold">RG:</span> {formData.rg}</p>
              <p><span className="font-semibold">Nascimento:</span> {formData.birthDate}</p>
            </div>
          )}
        </div>

        {/* Address Summary / Edit */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg transition-all">
          <div className="flex justify-between items-center mb-4">
            {!isEditingAddress && <h3 className="font-bold text-slate-900 dark:text-white text-sm">Endereço de Entrega</h3>}
          </div>

          {isEditingAddress && addressToEdit ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <CheckoutAddressForm
                initialData={addressToEdit}
                onSubmit={handleInlineSaveAddress}
                onCancel={() => setIsEditingAddress(false)}
                isSaving={isSavingAddress}
                submitLabel="Salvar Endereço"
                showBackButton={true}
                backButtonLabel="Cancelar"
              />
            </div>
          ) : (
            <>
              {addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr: any) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 relative group ${selectedAddressId === addr.id ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                    >
                      <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center transition-colors ${selectedAddressId === addr.id ? 'border-primary' : 'border-slate-400'}`}>
                        {selectedAddressId === addr.id && <div className="size-2 rounded-full bg-primary" />}
                      </div>
                      <div className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2 mb-1 justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{addr.type}</span>
                            {addr.isPrimary && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">Principal</span>}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleInlineEdit(addr); }}
                              className="text-xs text-primary hover:underline font-semibold"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(e, addr.id)}
                              className={`text-xs font-semibold flex items-center gap-1 transition-colors ${confirmDeleteId === addr.id ? 'text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded' : 'text-slate-400 hover:text-red-500'}`}
                              title={confirmDeleteId === addr.id ? "Confirmar exclusão" : "Excluir"}
                            >
                              {confirmDeleteId === addr.id ? 'Confirmar?' : <span className="material-symbols-outlined text-[16px]">delete</span>}
                            </button>
                          </div>
                        </div>
                        <p>{addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ''}</p>
                        <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                        <p>{addr.zip}</p>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => handleInlineEdit(null)}
                    className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Usar outro endereço
                  </button>
                </div>
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-start">
                    <div>
                      <p>{formData.street}, {formData.number} {formData.complement ? `- ${formData.complement}` : ''}</p>
                      <p>{formData.neighborhood} - {formData.city}/{formData.state}</p>
                      <p>{formData.cep}</p>
                    </div>
                    <button onClick={() => handleInlineEdit({
                      zip: formData.cep,
                      street: formData.street,
                      number: formData.number,
                      neighborhood: formData.neighborhood,
                      city: formData.city,
                      state: formData.state,
                      complement: formData.complement,
                      type: formData.addressType
                    })} className="text-xs text-primary hover:underline font-semibold">Editar</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg transition-all">
          <div className="flex justify-between items-center mb-2">
            {!isEditingContact && <h3 className="font-bold text-slate-900 dark:text-white text-sm">Contato</h3>}
            {!isEditingContact && <button onClick={() => setIsEditingContact(true)} className="text-xs text-primary font-bold hover:underline">Editar</button>}
          </div>
          {isEditingContact ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <CheckoutExtrasForm
                initialData={{ phone: formData.phone, email: formData.email, notes: formData.notes, attachmentUrl: order?.attachmentUrl }}
                onSubmit={handleSaveExtras}
                onCancel={() => setIsEditingContact(false)}
                submitLabel="Salvar Contato"
                showBackButton={true}
                backButtonLabel="Cancelar"
                showNotes={false}
                showFiles={false}
              />
            </div>
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <p><span className="font-semibold">Telefone:</span> {formData.phone}</p>
              <p><span className="font-semibold">E-mail:</span> {formData.email}</p>
            </div>
          )}
        </div>

        {/* Notes & Attachment Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg transition-all">
          <div className="flex justify-between items-center mb-2">
            {!isEditingNotes && <h3 className="font-bold text-slate-900 dark:text-white text-sm">Observações e Documentos</h3>}
            {!isEditingNotes && <button onClick={() => setIsEditingNotes(true)} className="text-xs text-primary font-bold hover:underline">Editar</button>}
          </div>

          {isEditingNotes ? (
            <div className="animate-in fade-in zoom-in-95 duration-200">
              <CheckoutExtrasForm
                initialData={{ phone: formData.phone, email: formData.email, notes: formData.notes, attachmentUrl: order?.attachmentUrl }}
                onSubmit={handleSaveExtras}
                onUpload={handleUpload}
                isUploading={isUploading}
                uploadSuccess={!!order?.attachmentUrl}
                onCancel={() => setIsEditingNotes(false)}
                submitLabel="Salvar Observações"
                showBackButton={true}
                backButtonLabel="Cancelar"
                showContact={false}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {formData.notes ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{formData.notes}"</p>
              ) : (
                <p className="text-sm text-slate-400 italic">Nenhuma observação.</p>
              )}

              {order?.attachmentUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                  <span className="material-symbols-outlined">attach_file</span>
                  <span className="font-medium">Receita anexada</span>
                  <a href={order.attachmentUrl} target="_blank" rel="noreferrer" className="ml-auto text-xs underline hover:text-green-700">Ver arquivo</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm mb-4 mt-2">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">lock</span>
          <div>
            <h3 className="font-bold mb-1">Pagamento Seguro</h3>
            <p>Ao clicar em "Confirmar e Pagar", você será redirecionado para a plataforma de pagamentos segura da Farmácia Central (Asaas) para escolher a forma de pagamento (Pix, Cartão ou Boleto).</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
        <button onClick={() => navigate('../details')} className="hidden md:flex text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium items-center gap-2">
          <span className="material-symbols-outlined">arrow_back</span> Voltar
        </button>
        <button
          onClick={submitOrder}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          {isProcessing ? 'Gerando Link de Pagamento...' : (
            <>
              <span className="material-symbols-outlined">lock</span>
              Confirmar e Pagar
            </>
          )}
        </button>
      </div>
    </div>
  )
}

const CheckoutSuccess = () => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center pb-8 p-10">
      <h1 className="text-2xl font-bold">Redirecionando...</h1>
    </div>
  )
}

// --- Main Component ---
export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial Form State
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    birthDate: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    notes: ''
  });

  const updateFormData = (data: Partial<CheckoutFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const deleteAddress = async (addressId: string) => {
    if (!orderId) {
      console.error('deleteAddress: Missing orderId');
      return;
    }
    try {
      console.log(`Deleting address ${addressId} for order ${orderId}`);
      await api.delete(`/checkout/${orderId}/address/${addressId}`);
      console.log('Address deleted on backend. Refreshing order...');
      await refreshOrder();
      console.log('Order refreshed.');
      toast.success('Endereço removido!');
    } catch (e) {
      console.error('Error deleting address:', e);
      toast.error('Erro ao remover endereço');
    }
  }

  // Save Progress Partial
  const saveProgress = async (overrideData?: Partial<CheckoutFormData>) => {
    if (!orderId) return;

    // Use override data if provided, efficiently merging with existing state
    const currentData = { ...formData, ...overrideData };

    // Prepare payload with all current form data
    const payload = {
      partial: true, // IMPORTANT: Tells backend NOT to create Asaas link yet
      name: currentData.name,
      cpf: currentData.cpf,
      rg: currentData.rg,
      birthDate: currentData.birthDate,
      email: currentData.email,
      phone: currentData.phone,
      address: {
        zip: currentData.cep,
        street: currentData.street,
        number: currentData.number,
        neighborhood: currentData.neighborhood,
        city: currentData.city,
        state: currentData.state,
        complement: currentData.complement,
        type: currentData.addressType,
      },
      notes: currentData.notes
    };

    try {
      const response = await api.post(`/checkout/${orderId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Failed to save progress', error);
      throw error; // Re-throw to handle in caller
    }
  };

  // Address Selection Logic
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const addresses = order?.customer?.addresses || [];

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const { data } = await api.get<OrderDetails>(`/checkout/${orderId}`);
      setOrder(data);

      // Sync selected address from order (if set by backend)
      if (data.addressId) {
        setSelectedAddressId(data.addressId);
      } else if (data.customer?.addresses?.length) {
        // Fallback to primary
        const defaultAddr = data.customer.addresses.find(a => a.isPrimary) || data.customer.addresses[0];
        setSelectedAddressId(defaultAddr.id);
      }

      if (data.customer && !formData.name) {
        const birthDateFormatted = data.customer.birthDate
          ? (data.customer.birthDate.includes('T')
            ? new Date(data.customer.birthDate).toLocaleDateString('pt-BR')
            : data.customer.birthDate)
          : '';

        // Auto-select address if exists
        if (data.customer.addresses && data.customer.addresses.length > 0) {
          const defaultAddr = data.customer.addresses.find(a => a.isPrimary) || data.customer.addresses[0];
          setSelectedAddressId(defaultAddr.id);

          // SKIP LOGIC: If customer exists (has name) and has addresses, go to confirmation
          // Only if we are at the "root" checkout path (step 1)
          if (data.customer.name !== 'Cliente Não Identificado' && location.pathname.endsWith(orderId)) {
            navigate('confirmation', { replace: true });
          }
        }

        setFormData(prev => ({
          ...prev,
          name: data.customer?.name === 'Cliente Não Identificado' ? '' : (data.customer?.name || ''),
          cpf: data.customer?.cpf || '',
          rg: data.customer?.rg || '',
          birthDate: birthDateFormatted,
          phone: data.customer?.phone || '',
          email: data.customer?.email || '',
          cep: data.customer?.addressZip || '',
          street: data.customer?.addressStreet || '',
          number: data.customer?.addressNumber || '',
          neighborhood: data.customer?.addressNeighborhood || '',
          city: data.customer?.addressCity || '',
          state: data.customer?.addressState || '',
          complement: data.customer?.addressComplement || '',
          addressType: 'Casa'
          // notes: data.notes?.[0]?.content || '' // REMOVED: Do not pre-fill notes from order history/attendant
        }));
      }
    } catch (error) {
      console.error('Falha ao carregar pedido', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrder = async () => {
    await fetchOrder();
  };

  // Fetch Order Data on Mount
  useEffect(() => {
    fetchOrder();
  }, [orderId, location.pathname]); // Added location.pathname to dependencies for skip logic

  const submitOrder = async () => {
    setIsProcessing(true);
    try {
      const payload: any = {
        partial: false,
        name: formData.name,
        cpf: formData.cpf,
        rg: formData.rg,
        birthDate: formData.birthDate,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes
      };

      // If we have a selected address ID, use it.
      // Otherwise, send the address form data.
      if (selectedAddressId) {
        payload.addressId = selectedAddressId;
      } else {
        payload.address = {
          zip: formData.cep,
          street: formData.street,
          number: formData.number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          complement: formData.complement,
          type: formData.addressType
        };
      }

      const { data } = await api.post<{ redirectUrl: string }>(`/checkout/${orderId}`, payload);

      window.location.href = data.redirectUrl;
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar. Tente novamente.');
      setIsProcessing(false);
    }
  };

  // Logic for steps
  let step = 1;
  if (location.pathname.includes('address')) step = 2;
  if (location.pathname.includes('details')) step = 3;
  if (location.pathname.includes('confirmation')) step = 4;

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <CheckoutContext.Provider value={{ order, formData, updateFormData, saveProgress, loading, submitOrder, isProcessing, refreshOrder, addresses, selectedAddressId, setSelectedAddressId, deleteAddress }}>
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col font-display">

        {/* Simulation Bar Removed */}

        <header className="bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-checkout.png" alt="La Botica Pay" className="h-10 object-contain" />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span className="hidden sm:inline">Ambiente 100% Seguro</span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
          {step < 5 && (
            <div className="mb-10 max-w-4xl mx-auto flex justify-between relative">
              {/* Progress Bar Background */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10 -translate-y-1/2"></div>
              {/* Active Progress */}
              <div className="absolute top-1/2 left-0 h-0.5 bg-primary -z-10 -translate-y-1/2 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

              {['Identificação', 'Endereço', 'Contato', 'Confirmação'].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = stepNum === step;
                const isCompleted = stepNum < step;

                return (
                  <div key={idx} className="flex flex-col items-center bg-background-light dark:bg-background-dark px-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${isActive ? 'bg-primary text-slate-900 ring-4 ring-white dark:ring-background-dark' :
                      isCompleted ? 'bg-green-100 text-green-600 border-2 border-green-200' :
                        'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                      {isCompleted ? <span className="material-symbols-outlined text-sm">check</span> : stepNum}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${isActive || isCompleted ? 'text-green-700 dark:text-green-500' : 'text-slate-400'}`}>{label}</span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <MobileOrderSummary />

              <Routes>
                <Route index element={<CheckoutStep1 />} />
                <Route path="address" element={<CheckoutStep2 />} />
                <Route path="details" element={<CheckoutStep3 />} />
                <Route path="confirmation" element={<CheckoutStepConfirmation />} />
                <Route path="success" element={<CheckoutSuccess />} />
              </Routes>
            </div>

            <div className="lg:col-span-1">
              <OrderSummary />
            </div>
          </div>
        </main>

        <footer className="bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
            <p className="mb-2">Salgado e Campos LTDA • CNPJ 18.338.132/0001-93</p>
            <p>Rua Américo Totti, 1106, Centro - Alfenas, MG</p>
          </div>
        </footer>
      </div>
    </CheckoutContext.Provider>
  );
};