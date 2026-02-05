
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
  status: string; // Order status
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
  transactions?: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    metadata: any;
  }>;
}

// Update Interface
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

  // Delivery
  deliveryMethod?: 'SHIP' | 'PICKUP';
  pickupLocation?: string;
}

// ...



interface CheckoutContextType {
  order: OrderDetails | null;
  formData: CheckoutFormData;
  updateFormData: (data: Partial<CheckoutFormData>) => void;
  saveProgress: (overrideData?: Partial<CheckoutFormData>) => Promise<any>;
  loading: boolean;
  submitOrder: (paymentData: any) => Promise<any>;
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
  const { order, formData } = useCheckout(); // Get formData for label check

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

  const isPickup = formData.deliveryMethod === 'PICKUP';

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
          <span>
            {isPickup ? 'Retirada na loja' : (Number(order.shippingValue) === 7 ? 'Entrega Local' : 'Frete')}
          </span>
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
  const { formData, updateFormData, saveProgress, refreshOrder } = useCheckout();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (data: AddressData) => {
    setIsSaving(true);
    // Update global context immediately
    const updatedData = {
      ...data,
      deliveryMethod: data.deliveryMethod,
      pickupLocation: data.pickupLocation
    };
    updateFormData(updatedData);
    try {
      await saveProgress(updatedData);
      // Refresh order to get updated shipping value from backend!
      await refreshOrder();
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
        submitLabel="Calcular Frete e Avançar"
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

// --- Step 4: Confirmação (Payment) ---
const CheckoutStepConfirmation = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, saveProgress, submitOrder, isProcessing, order, addresses, selectedAddressId, setSelectedAddressId, refreshOrder, deleteAddress } = useCheckout();

  const [editingSection, setEditingSection] = useState<'NONE' | 'ADDRESS' | 'METHOD'>('NONE');
  const [addressToEdit, setAddressToEdit] = useState<AddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Partial Edits
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX'>('CREDIT_CARD');
  const [cardData, setCardData] = useState({ number: '', holderName: '', month: '', year: '', cvv: '', installments: 1 });
  const [pixResult, setPixResult] = useState<{ qrcode: string, qrcodeText: string } | null>(null);

  // --- Handlers from previous version (preserved) ---
  const handleInlineEdit = (addr?: any) => {
    if (addr) {
      setAddressToEdit({
        cep: addr.zip, street: addr.street, number: addr.number, neighborhood: addr.neighborhood,
        city: addr.city, state: addr.state, complement: addr.complement, addressType: addr.type,
        deliveryMethod: formData.deliveryMethod, pickupLocation: formData.pickupLocation
      });
    } else {
      setAddressToEdit({
        cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '', addressType: 'Casa',
        deliveryMethod: formData.deliveryMethod, pickupLocation: formData.pickupLocation
      });
    }
    setEditingSection('ADDRESS');
  };

  const handleInlineSaveAddress = async (data: AddressData) => {
    setIsSavingAddress(true);
    updateFormData(data);
    try {
      await saveProgress(data);
      await refreshOrder();
      setEditingSection('NONE');
      setAddressToEdit(null);
      toast.success('Salvo com sucesso!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar.');
    } finally { setIsSavingAddress(false); }
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (confirmDeleteId === id) { await deleteAddress(id); setConfirmDeleteId(null); } else { setConfirmDeleteId(id); }
  };

  const handleSavePerson = async (data: PersonalData) => {
    updateFormData(data);
    try { await saveProgress(data); setIsEditingPerson(false); toast.success('Dados atualizados!'); } catch (e) { toast.error('Erro ao atualizar dados.'); }
  }

  const handleSaveExtras = async (data: ExtrasData) => {
    updateFormData(data);
    try { await saveProgress(data); setIsEditingContact(false); setIsEditingNotes(false); toast.success('Atualizado com sucesso!'); } catch (e) { toast.error('Erro ao atualizar.'); }
  }

  const handleUpload = async (file: File) => {
    if (!order?.id) return false;
    if (file.size > 10 * 1024 * 1024) { toast.error('Arquivo muito grande.'); return false; }
    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    try { await api.post(`/checkout/${order.id}/upload`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); await refreshOrder(); return true; } catch (e) { toast.error('Erro no upload.'); return false; } finally { setIsUploading(false); }
  };

  // --- Payment Handler ---
  const handlePayment = async () => {
    try {
      if (paymentMethod === 'CREDIT_CARD') {
        if (cardData.number.length < 13 || !cardData.cvv || !cardData.holderName || !cardData.month || !cardData.year) {
          toast.error('Preencha os dados do cartão corretamente.');
          return;
        }
      }

      const result = await submitOrder({
        method: paymentMethod,
        card: paymentMethod === 'CREDIT_CARD' ? cardData : undefined
      });

      if (paymentMethod === 'PIX' && result.kind === 'pix') {
        // Show Pix Modal/Result
        // Result usually mimics e.Rede: { kind: 'pix', reference: '...', amount: 1000, qrcode: '...', qrcodeText: '...' }
        // Sandbox might return differently, checking... assuming qrcode exists.
        // If e.Rede returns just ID and we need to query, that's complex, but usually creates immediately.
        setPixResult(result);
        toast.success("QR Code Gerado!");
      } else if (result.returnCode === '00' || result.status === 'PAID') {
        // Success
        navigate('../success');
      } else {
        toast.error(`Pagamento não autorizado. (${result.returnMessage || result.returnCode || 'Erro'})`);
      }

    } catch (e) {
      // Handled in submitOrder (toast)
    }
  };

  if (pixResult) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center animate-in zoom-in-95 duration-300">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pagamento via Pix</h2>
        <p className="text-slate-500 mb-6">Escaneie o QR Code abaixo ou use o Copia e Cola para pagar.</p>

        <div className="flex justify-center mb-6">
          {/* Assuming base64 or URL. If Base64, prefix data:image/png;base64, */}
          {/* Rede often returns a URL or Base64. If text, render QRCode lib. For MVP, assuming Image URL if starts with http, else base64? */}
          {/* Rede doc says 'qrcode' field contains the image (base64) or url. */}
          <img src={`data:image/png;base64,${pixResult.qrcode}`} alt="Pix QR Code" className="w-64 h-64 object-contain border rounded-lg" />
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg flex items-center justify-between gap-2 overflow-hidden mb-6">
          <span className="text-xs text-slate-500 truncate font-mono">{pixResult.qrcodeText || 'Código não disponível'}</span>
          <button onClick={() => {
            const text = pixResult.qrcodeText || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text).then(() => toast.success('Copiado!')).catch(() => toast.error('Erro ao copiar'));
            } else {
              // Fallback for older browsers or non-secure contexts
              const textArea = document.createElement("textarea");
              textArea.value = text;
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              try {
                document.execCommand('copy');
                toast.success('Copiado!');
              } catch (err) {
                toast.error('Erro ao copiar');
              }
              document.body.removeChild(textArea);
            }
          }} className="text-primary font-bold text-sm hover:underline">Copiar</button>
        </div>

        <button onClick={() => navigate('../success')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">
          Já fiz o pagamento
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 bg-surface-light dark:bg-surface-dark p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">check_circle</span>
        Confirmar e Pagar
      </h2>

      <div className="space-y-6">
        {/* Summaries (Person, Address, Contact, Notes) - Same as before */}
        {/* Personal Info Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg relative transition-all">
          <div className="flex justify-between items-center mb-2">
            {!isEditingPerson && <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dados Pessoais</h3>}
            {!isEditingPerson && <button onClick={() => setIsEditingPerson(true)} className="text-xs text-primary font-bold hover:underline">Editar</button>}
          </div>
          {isEditingPerson ? (
            <CheckoutPersonalForm initialData={formData} onSubmit={handleSavePerson} onCancel={() => setIsEditingPerson(false)} submitLabel="Atualizar" showBackButton={true} backButtonLabel="Cancelar" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
              <p><span className="font-semibold">Nome:</span> {formData.name}</p>
              <p><span className="font-semibold">CPF:</span> {formData.cpf}</p>
            </div>
          )}
        </div>

        {/* Address and Method Summary */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg transition-all">
          <div className="flex justify-between items-center mb-4">
            {editingSection === 'NONE' && (
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Endereço
              </h3>
            )}
          </div>

          {editingSection !== 'NONE' ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckoutAddressForm
                initialData={addressToEdit || {
                  cep: formData.cep, street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
                  city: formData.city, state: formData.state, complement: formData.complement, addressType: formData.addressType,
                  deliveryMethod: formData.deliveryMethod, pickupLocation: formData.pickupLocation
                }}
                onSubmit={handleInlineSaveAddress}
                onCancel={() => setEditingSection('NONE')}
                isSaving={isSavingAddress}
                submitLabel="Salvar Alterações"
                showBackButton={true}
                backButtonLabel="Cancelar"
                viewMode={editingSection === 'ADDRESS' ? 'address-only' : 'method-only'}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customer Address Card */}
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 relative">
                <p className="text-xs text-slate-500 uppercase font-bold mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">home</span>
                  Endereço do Cliente
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formData.street}, {formData.number} {formData.complement ? `- ${formData.complement}` : ''}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formData.neighborhood} - {formData.city}/{formData.state}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">CEP: {formData.cep}</p>

                <button
                  onClick={() => {
                    setAddressToEdit({
                      cep: formData.cep, street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
                      city: formData.city, state: formData.state, complement: formData.complement, addressType: formData.addressType,
                      deliveryMethod: formData.deliveryMethod, pickupLocation: formData.pickupLocation
                    });
                    setEditingSection('ADDRESS');
                  }}
                  className="absolute top-3 right-3 text-xs text-primary hover:underline font-bold bg-white/50 px-2 py-1 rounded uppercase"
                >
                  Alterar
                </button>
              </div>

              {/* Delivery Method Card */}
              <div className="p-3 rounded-lg border border-primary bg-primary/5 relative">
                <h4 className="text-xs text-primary font-bold uppercase mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    {formData.deliveryMethod === 'PICKUP' ? 'store' : 'local_shipping'}
                  </span>
                  {formData.deliveryMethod === 'PICKUP' ? 'Retirada na Loja' : 'Entrega'}
                </h4>

                {formData.deliveryMethod === 'PICKUP' ? (
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{formData.pickupLocation}</p>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Frete Grátis</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      Entrega via Transportadora/Moto
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {Number(order?.shippingValue) > 0
                        ? `Frete: ${(Number(order?.shippingValue)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                        : Number(order?.shippingValue) === 0 ? 'Frete Grátis' : 'Calculando...'
                      }
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setAddressToEdit({
                      cep: formData.cep, street: formData.street, number: formData.number, neighborhood: formData.neighborhood,
                      city: formData.city, state: formData.state, complement: formData.complement, addressType: formData.addressType,
                      deliveryMethod: formData.deliveryMethod, pickupLocation: formData.pickupLocation
                    });
                    setEditingSection('METHOD');
                  }}
                  className="absolute top-3 right-3 text-xs text-primary hover:underline font-bold bg-white/50 px-2 py-1 rounded uppercase"
                >
                  Alterar
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Payment Section - Redesigned */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Pagamento</h3>
          <p className="text-sm text-slate-500 mb-4">Todas as transações são seguras e criptografadas.</p>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">

            {/* Credit Card Option */}
            <div className={`transition-all ${paymentMethod === 'CREDIT_CARD' ? 'bg-blue-50/50 dark:bg-slate-800' : 'bg-white dark:bg-black/20'}`}>
              <div
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className="flex items-center justify-between p-4 cursor-pointer border-b border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'CREDIT_CARD' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                    {paymentMethod === 'CREDIT_CARD' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Cartão de Crédito</span>
                </div>
                <div className="flex gap-2 items-center">
                  <img src="/icons/visa.svg" alt="Visa" className="h-5" />
                  <img src="/icons/mastercard.svg" alt="Mastercard" className="h-5" />
                  <img src="/icons/elo.svg" alt="Elo" className="h-5" />
                  <img src="/icons/amex.svg" alt="Amex" className="h-5" />
                  <img src="/icons/hypercard.svg" alt="Hypercard" className="h-5" />
                </div>
              </div>

              {paymentMethod === 'CREDIT_CARD' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Card Number */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Número do cartão"
                      className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-600 rounded-md pl-4 pr-10 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
                      value={cardData.number
                        .replace(/\D/g, '')
                        .replace(/(\d{4})(?=\d)/g, '$1 ')
                        .trim()
                      }
                      maxLength={19}
                      onChange={e => {
                        let raw = e.target.value.replace(/\D/g, '');
                        if (raw.length > 16) raw = raw.slice(0, 16);
                        setCardData({ ...cardData, number: raw });
                      }}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">lock</span>
                  </div>

                  {/* Expiry & CVV */}
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Data de vencimento (MM/AA)"
                        className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-600 rounded-md px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
                        value={cardData.month + (cardData.year && cardData.year.length > 2 ? '/' + cardData.year.slice(2) : '')}
                        maxLength={5}
                        onChange={e => {
                          let raw = e.target.value.replace(/\D/g, '');
                          if (raw.length > 4) raw = raw.slice(0, 4);

                          let m = raw.slice(0, 2);
                          let y = raw.slice(2);

                          if (m.length === 2) {
                            const val = parseInt(m);
                            if (val === 0) m = '01';
                            if (val > 12) m = '12';
                          }

                          setCardData(prev => ({
                            ...prev,
                            month: m,
                            year: y ? `20${y}` : ''
                          }));
                        }}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Código de segurança"
                        className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-600 rounded-md px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
                        value={cardData.cvv}
                        maxLength={4}
                        onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none help" title="3 ou 4 dígitos no verso do cartão">help</span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <input
                      type="text"
                      placeholder="Nome no cartão"
                      className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-600 rounded-md px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all uppercase"
                      value={cardData.holderName}
                      onChange={e => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                    />
                  </div>

                  {/* Installments */}
                  <div>
                    <select
                      className="w-full bg-white dark:bg-black border border-slate-300 dark:border-slate-600 rounded-md px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
                      value={cardData.installments}
                      onChange={e => setCardData({ ...cardData, installments: Number(e.target.value) })}
                    >
                      <option value={1}>1x sem juros</option>
                      <option value={2}>2x sem juros</option>
                      <option value={3}>3x sem juros</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            {/* Pix Option */}
            <div className={`transition-all ${paymentMethod === 'PIX' ? 'bg-blue-50/50 dark:bg-slate-800' : 'bg-white dark:bg-black/20'}`}>
              <div
                onClick={() => setPaymentMethod('PIX')}
                className="flex items-center justify-between p-4 cursor-pointer border-t border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'PIX' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                    {paymentMethod === 'PIX' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">Pix</span>
                </div>
                <div>
                  <img src="/icons/pix.svg" alt="Pix" className="h-6" />
                </div>
              </div>
              {paymentMethod === 'PIX' && (
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-center animate-in slide-in-from-top-2 duration-200 flex flex-col items-center">
                  <img src="/icons/pix.svg" alt="Pix" className="h-10 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">O código QR para pagamento será gerado após finalizar o pedido.</p>
                  <p className="text-xs text-slate-500 mt-2">Aprovação imediata - 100% Seguro</p>
                </div>
              )}
            </div>

          </div>
        </div >

      </div >

      {/* Footer Actions */}
      < div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100 dark:border-slate-800" >
        <button onClick={() => navigate('../details')} className="hidden md:flex text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium items-center gap-2">
          <span className="material-symbols-outlined">arrow_back</span> Voltar
        </button>
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          {isProcessing ? 'Processando...' : (
            <>
              <span className="material-symbols-outlined">lock</span>
              {paymentMethod === 'PIX' ? 'Gerar Pix' : 'Pagar Agora'}
            </>
          )}
        </button>
      </div >
    </div >
  )
}

const CheckoutSuccess = () => {
  const { order, formData } = useCheckout();

  // Helper to print
  const handlePrint = () => {
    window.print();
  };

  // Infer Payment Method from recent context or generic
  // Since paymentMethod isn't explicitly in formData, we might just say "Confirmado" or look at order status
  // If we really want it, we'd need to store it in formData during step 4, but for now:
  const paymentLabel = order?.status === 'PAID' ? 'Confirmado' : 'Processando';

  return (
    <div className="max-w-xl mx-auto">
      {/* Success Header - No Print */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-center pb-8 p-8 md:p-12 animate-in zoom-in-95 duration-500 print:hidden">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-500">check_circle</span>
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Pagamento Confirmado!</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Seu pedido foi processado com sucesso. Você receberá os detalhes e o rastreamento por e-mail/WhatsApp.
        </p>

        {order && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 max-w-xs mx-auto mb-8">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Número do Pedido</p>
            <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 px-6 rounded-lg transition-all shadow-sm">
            <span className="material-symbols-outlined">download</span> Baixar Comprovante
          </button>
        </div>
      </div>

      {/* Voucher Section - Printable */}
      <div id="voucher-area" className="mt-8 bg-white border border-slate-200 p-8 rounded-xl shadow-sm print:shadow-none print:border-none print:p-0 print:mt-0">
        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Comprovante do Pedido</h2>
            <p className="text-slate-500 text-sm mt-1">Salgado e Campos LTDA</p>
          </div>
          {order && (
            <div className="text-right">
              <p className="text-sm text-slate-400 uppercase font-bold">Pedido</p>
              <p className="text-lg font-mono font-bold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Cliente</p>
            <p className="font-bold text-slate-800">{formData.name}</p>
            <p className="text-sm text-slate-600">CPF: {formData.cpf}</p>
            <p className="text-sm text-slate-600">{formData.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Método de Entrega</p>
            {formData.deliveryMethod === 'PICKUP' ? (
              <div>
                <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded mb-1">RETIRADA NA LOJA</span>
                <p className="font-bold text-slate-800 text-sm mt-1">{formData.pickupLocation}</p>
                <p className="text-xs text-slate-500 mt-1">Apresente este comprovante na retirada.</p>
              </div>
            ) : (
              <div>
                <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded mb-1">ENTREGA</span>
                <p className="text-sm text-slate-700 mt-1">{formData.street}, {formData.number}</p>
                <p className="text-sm text-slate-700">{formData.neighborhood} - {formData.city}/{formData.state}</p>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase font-bold text-slate-400 mb-1">Pagamento</p>
            {order?.transactions?.[0] ? (
              <div>
                <p className="font-bold text-slate-800 uppercase">
                  {order.transactions[0].type === 'CREDIT_CARD' ? 'Cartão de Crédito' : 'Pix'}
                </p>
                {order.transactions[0].type === 'CREDIT_CARD' && (
                  <div className="text-sm text-slate-600 mt-1">
                    <p>Final: **** {order.transactions[0].metadata?.last4}</p>
                    <p className="text-xs text-slate-500">{order.transactions[0].metadata?.installments}x sem juros</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Processando...</p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs uppercase font-bold text-slate-400 mb-2">Itens do Pedido</p>
          {/* Re-using OrderSummaryContent logic but static for print/view */}
          <div className="border rounded-lg p-4 bg-slate-50 print:bg-transparent print:border-slate-200">
            <OrderSummaryContent />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
          <div>
            <p className="text-xs uppercase font-bold text-slate-400">Status do Pagamento</p>
            <p className="text-green-600 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {order?.status === 'PAID' ? 'Pago / Confirmado' : 'Aguardando Pagamento'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Data do Pedido</p>
            <p className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
              @media print {
                  body * { visibility: hidden; }
                  #voucher-area, #voucher-area * { visibility: visible; }
                  #voucher-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; border: none; shadow: none; }
                  header, footer, .mb-10 { display: none !important; }
              }
          `}</style>
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
      deliveryMethod: currentData.deliveryMethod,
      pickupLocation: currentData.pickupLocation,
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

      if (data.status === 'PAID') {
        // Prevent infinite loop by checking if we are already on the success page
        if (!location.pathname.includes('/success')) {
          navigate(`/checkout/${orderId}/success`, { replace: true });
        }
        return;
      }

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
        }

        const autoAddr = data.customer?.addresses?.find(a => a.isPrimary) || data.customer?.addresses?.[0];

        setFormData(prev => ({
          ...prev,
          name: data.customer?.name === 'Cliente Não Identificado' ? '' : (data.customer?.name || ''),
          cpf: data.customer?.cpf || '',
          rg: data.customer?.rg || '',
          birthDate: birthDateFormatted,
          phone: data.customer?.phone || '',
          email: data.customer?.email || '',
          cep: autoAddr?.zip || '',
          street: autoAddr?.street || '',
          number: autoAddr?.number || '',
          neighborhood: autoAddr?.neighborhood || '',
          city: autoAddr?.city || '',
          state: autoAddr?.state || '',
          complement: autoAddr?.complement || '',
          addressType: autoAddr?.type || 'Casa'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // Remove location.pathname to prevent infinite refetch loop on navigation

  const submitOrder = async (paymentData: any) => {
    setIsProcessing(true);
    try {
      // 1. Save Progress (Ensure contact/address is up to date)
      const progressPayload: any = {
        partial: false,
        name: formData.name,
        cpf: formData.cpf,
        rg: formData.rg,
        birthDate: formData.birthDate,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes
      };

      if (selectedAddressId) {
        progressPayload.addressId = selectedAddressId;
      } else {
        progressPayload.address = {
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
      // Save contact info updates
      await api.post(`/checkout/${orderId}`, progressPayload);

      // 2. Process Payment
      const payPayload = {
        paymentMethod: paymentData.method,
        cardData: paymentData.card,
        amount: order?.totalValue // Optional verification
      };

      const { data } = await api.post(`/checkout/${orderId}/pay`, payPayload);

      // If success or Pix Return
      return data;

    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar pagamento. Verifique os dados.');
      // Re-throw so component can verify
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Logic for steps
  let step = 1;
  if (location.pathname.includes('address')) step = 2;
  if (location.pathname.includes('details')) step = 3;
  if (location.pathname.includes('confirmation')) step = 4;
  if (location.pathname.includes('success')) step = 5;

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

          {step === 5 ? (
            // Success Page Layout (Full Width, Centered)
            <div className="max-w-2xl mx-auto">
              <Routes>
                <Route path="success" element={<CheckoutSuccess />} />
              </Routes>
            </div>
          ) : (
            // Standard Steps Layout (Grid + Sidebar)
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <MobileOrderSummary />

                <Routes>
                  <Route index element={<CheckoutStep1 />} />
                  <Route path="address" element={<CheckoutStep2 />} />
                  <Route path="details" element={<CheckoutStep3 />} />
                  <Route path="confirmation" element={<CheckoutStepConfirmation />} />
                </Routes>
              </div>

              <div className="lg:col-span-1">
                <OrderSummary />
              </div>
            </div>
          )}
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