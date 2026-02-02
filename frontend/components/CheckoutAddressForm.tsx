import React, { useState, useEffect } from 'react';

const BR_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const STORE_LOCATIONS = [
    { id: 'alfenas-01', name: 'La Botica | Alfenas | Filial 01', address: 'Rua Francisco Mariano, 182 - Centro, Alfenas - MG' },
    { id: 'alfenas-02', name: 'La Botica | Alfenas | Filial 02', address: 'Av. Gov. Valadares, 485 - Centro, Alfenas - MG' },
    { id: 'machado', name: 'La Botica | Machado', address: 'Pça. Antônio Carlos, 102 - Centro, Machado - MG' },
    { id: 'pocos', name: 'La Botica | Poços de Caldas', address: 'Rua Prefeito Chagas, 282 - Centro, Poços de Caldas - MG' },
];

const maskCEP = (val: string) => {
    return val
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d{3})?$/, '$1-$2');
};

export interface AddressData {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement: string;
    addressType: string;
    // New Fields
    deliveryMethod?: 'SHIP' | 'PICKUP';
    pickupLocation?: string;
}

interface CheckoutAddressFormProps {
    initialData: AddressData;
    onSubmit: (data: AddressData) => void;
    onCancel?: () => void;
    isSaving?: boolean;
    submitLabel?: string;
    showBackButton?: boolean;
    backButtonLabel?: string;
    viewMode?: 'full' | 'address-only' | 'method-only';
}

export const CheckoutAddressForm: React.FC<CheckoutAddressFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSaving = false,
    submitLabel = 'Salvar Endereço',
    showBackButton = false,
    backButtonLabel = 'Voltar',
    viewMode = 'full'
}) => {
    const [formData, setFormData] = useState<AddressData>({
        ...initialData,
        deliveryMethod: initialData.deliveryMethod || 'SHIP',
        pickupLocation: initialData.pickupLocation || ''
    });
    const [loadingCep, setLoadingCep] = useState(false);
    const [noNumber, setNoNumber] = useState(initialData.number === 'S/N');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(prev => ({ ...prev, ...initialData }));
        setNoNumber(initialData.number === 'S/N');
    }, [initialData]);

    const updateFormData = (data: Partial<AddressData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = maskCEP(e.target.value);
        updateFormData({ cep: value });
        if (errors.cep) setErrors(prev => ({ ...prev, cep: '' }));

        const cleanCep = value.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            setLoadingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    updateFormData({
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    });
                    setErrors(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
                }
            } catch (err) {
                console.error('Erro ao buscar CEP', err);
            } finally {
                setLoadingCep(false);
            }
        }
    };

    const handleNoNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setNoNumber(isChecked);
        if (isChecked) {
            updateFormData({ number: 'S/N' });
            setErrors(prev => ({ ...prev, number: '' }));
        } else {
            updateFormData({ number: '' });
        }
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.cep || !formData.cep.trim()) newErrors.cep = 'CEP é obrigatório.';
        if (!formData.street || !formData.street.trim()) newErrors.street = 'Rua é obrigatória.';
        if ((!formData.number || !formData.number.trim()) && !noNumber) newErrors.number = 'Número é obrigatório.';
        if (!formData.neighborhood || !formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório.';
        if (!formData.city || !formData.city.trim()) newErrors.city = 'Cidade é obrigatória.';
        if (!formData.state || !formData.state.trim()) newErrors.state = 'UF obrigatório.';

        if (formData.deliveryMethod === 'PICKUP') {
            if (!formData.pickupLocation) newErrors.pickupLocation = 'Selecione um local de retirada.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="flex flex-col gap-6">

            {/* 1. Address Section (Always Visible) */}
            {(viewMode === 'full' || viewMode === 'address-only') && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">location_on</span>
                        Endereço
                    </h2>

                    <div className="space-y-6">
                        {/* CEP */}
                        <label className="flex flex-col gap-2 relative">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CEP <span className="text-red-500">*</span></span>
                            <div className="relative">
                                <input
                                    value={formData.cep}
                                    onChange={handleCepChange}
                                    maxLength={9}
                                    className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.cep ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder="00000-000"
                                    type="text"
                                />
                                {loadingCep && (
                                    <div className="absolute right-4 top-3.5">
                                        <span className="block size-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
                                    </div>
                                )}
                            </div>
                            {errors.cep && <p className="text-xs text-red-500">{errors.cep}</p>}
                        </label>

                        {/* Street */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <label className="flex flex-col gap-2 md:col-span-3">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Rua / Logradouro <span className="text-red-500">*</span></span>
                                <input
                                    value={formData.street}
                                    onChange={e => {
                                        updateFormData({ street: e.target.value });
                                        if (errors.street) setErrors(prev => ({ ...prev, street: '' }));
                                    }}
                                    className={`w-full rounded-lg border bg-slate-50 dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.street ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder="Preenchimento automático"
                                    type="text"
                                />
                                {errors.street && <p className="text-xs text-red-500">{errors.street}</p>}
                            </label>

                            {/* Number */}
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Número <span className="text-red-500">*</span></span>
                                <div className="relative">
                                    <input
                                        value={formData.number}
                                        disabled={noNumber}
                                        onChange={e => {
                                            updateFormData({ number: e.target.value });
                                            if (errors.number) setErrors(prev => ({ ...prev, number: '' }));
                                        }}
                                        className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.number ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} ${noNumber ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        placeholder="123"
                                        type="text"
                                    />
                                </div>
                                {errors.number && <p className="text-xs text-red-500">{errors.number}</p>}
                            </label>
                        </div>

                        {/* No Number Checkbox */}
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary" checked={noNumber} onChange={handleNoNumberChange} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Sem número</span>
                            </label>
                        </div>

                        {/* Neighborhood & Complement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bairro <span className="text-red-500">*</span></span>
                                <input
                                    value={formData.neighborhood}
                                    onChange={e => {
                                        updateFormData({ neighborhood: e.target.value });
                                        if (errors.neighborhood) setErrors(prev => ({ ...prev, neighborhood: '' }));
                                    }}
                                    className={`w-full rounded-lg border bg-slate-50 dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.neighborhood ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder="Preenchimento automático"
                                    type="text"
                                />
                                {errors.neighborhood && <p className="text-xs text-red-500">{errors.neighborhood}</p>}
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Complemento</span>
                                <input
                                    value={formData.complement}
                                    onChange={e => updateFormData({ complement: e.target.value })}
                                    className="w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all border-slate-200 dark:border-slate-700"
                                    placeholder="Apto, Bloco, etc."
                                    type="text"
                                />
                            </label>
                        </div>

                        {/* City & State */}
                        <div className="grid grid-cols-3 gap-6">
                            <label className="flex flex-col gap-2 col-span-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade <span className="text-red-500">*</span></span>
                                <input
                                    value={formData.city}
                                    onChange={e => {
                                        updateFormData({ city: e.target.value });
                                        if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
                                    }}
                                    className={`w-full rounded-lg border bg-slate-50 dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.city ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                                    placeholder="Cidade"
                                    type="text"
                                />
                                {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">UF <span className="text-red-500">*</span></span>
                                <select
                                    value={formData.state}
                                    onChange={e => {
                                        updateFormData({ state: e.target.value });
                                        if (errors.state) setErrors(prev => ({ ...prev, state: '' }));
                                    }}
                                    className={`w-full rounded-lg border bg-slate-50 dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.state ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                                >
                                    <option value="">UF</option>
                                    {BR_STATES.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                                {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                            </label>
                        </div>

                        {/* Address Type */}
                        <div className="grid grid-cols-1 gap-6">
                            <label className="flex flex-col gap-2">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Endereço <span className="text-xs font-normal text-slate-400">(Opcional)</span></span>
                                <div className="flex gap-2">
                                    {['Casa', 'Trabalho', 'Outro'].map(type => (
                                        <label key={type} className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm border rounded-lg cursor-pointer transition-all ${formData.addressType === type ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <input
                                                type="radio"
                                                name="addressType"
                                                value={type}
                                                checked={formData.addressType === type}
                                                onChange={() => updateFormData({ addressType: type })}
                                                className="hidden"
                                            />
                                            <span className="material-symbols-outlined text-[18px]">
                                                {type === 'Casa' ? 'home' : type === 'Trabalho' ? 'work' : 'location_on'}
                                            </span>
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'full' && <hr className="border-slate-200 dark:border-slate-800" />}

            {/* 2. Method Selection (After Address) */}
            {(viewMode === 'full' || viewMode === 'method-only') && (
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">local_shipping</span>
                        Método de Entrega / Retirada
                    </h2>

                    <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4">
                        <button
                            onClick={() => updateFormData({ deliveryMethod: 'SHIP' })}
                            className={`flex-1 py-3 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.deliveryMethod === 'SHIP' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <span className="material-symbols-outlined">local_shipping</span>
                            Entrega via Transportadora
                        </button>
                        <button
                            onClick={() => updateFormData({ deliveryMethod: 'PICKUP' })}
                            className={`flex-1 py-3 px-4 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${formData.deliveryMethod === 'PICKUP' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <span className="material-symbols-outlined">store</span>
                            Retirar na Loja
                        </button>
                    </div>

                    {/* Pickup Location Selection - Only if PICKUP is selected */}
                    {formData.deliveryMethod === 'PICKUP' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Escolha a unidade para retirada:
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {STORE_LOCATIONS.map(loc => (
                                    <div
                                        key={loc.id}
                                        onClick={() => updateFormData({ pickupLocation: loc.name })}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${formData.pickupLocation === loc.name ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'}`}
                                    >
                                        <div className={`mt-0.5 size-5 rounded-full border flex items-center justify-center ${formData.pickupLocation === loc.name ? 'border-primary' : 'border-slate-400'}`}>
                                            {formData.pickupLocation === loc.name && <div className="size-2.5 rounded-full bg-primary" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{loc.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{loc.address}</p>
                                            <span className="inline-block mt-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-0.5 rounded">
                                                Frete Grátis
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.pickupLocation && <p className="text-xs text-red-500 mt-2">{errors.pickupLocation}</p>}
                        </div>
                    )}

                    {/* Info Text for Shipping */}
                    {formData.deliveryMethod === 'SHIP' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3 items-center mt-4">
                            <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-1 text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined text-sm">info</span>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-tight">
                                O valor será calculado com base no seu endereço. (Algumas cidades possuem taxa fixa local).
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                {showBackButton && onCancel ? (
                    <button onClick={onCancel} className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center justify-center gap-2 py-3 sm:py-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 sm:hover:bg-transparent">
                        <span className="material-symbols-outlined">arrow_back</span> {backButtonLabel}
                    </button>
                ) : (
                    <div className="hidden sm:block"></div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-slate-900 font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? 'Salvando...' : submitLabel}
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};
