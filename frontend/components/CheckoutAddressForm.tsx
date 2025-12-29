import React, { useState, useEffect } from 'react';

const BR_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

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
}

interface CheckoutAddressFormProps {
    initialData: AddressData;
    onSubmit: (data: AddressData) => void;
    onCancel?: () => void;
    isSaving?: boolean;
    submitLabel?: string;
    showBackButton?: boolean;
    backButtonLabel?: string;
}

export const CheckoutAddressForm: React.FC<CheckoutAddressFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSaving = false,
    submitLabel = 'Salvar Endereço',
    showBackButton = false,
    backButtonLabel = 'Voltar'
}) => {
    const [formData, setFormData] = useState<AddressData>(initialData);
    const [loadingCep, setLoadingCep] = useState(false);
    const [noNumber, setNoNumber] = useState(initialData.number === 'S/N');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialData);
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
        if (!formData.cep.trim()) newErrors.cep = 'CEP é obrigatório.';
        if (!formData.street.trim()) newErrors.street = 'Rua é obrigatória.';
        if (!formData.number.trim() && !noNumber) newErrors.number = 'Número é obrigatório.';
        if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório.';
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória.';
        if (!formData.state.trim()) newErrors.state = 'UF obrigatório.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Endereço de Entrega
            </h2>

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
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Número <span className="text-red-500">*</span></label>
                    <input
                        value={formData.number}
                        onChange={e => {
                            updateFormData({ number: e.target.value });
                            if (errors.number) setErrors(prev => ({ ...prev, number: '' }));
                        }}
                        disabled={noNumber}
                        className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800 ${errors.number ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="123"
                        type="text"
                    />
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                            type="checkbox"
                            checked={noNumber}
                            onChange={handleNoNumberChange}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-slate-500">Sem número</span>
                    </label>
                    {errors.number && <p className="text-xs text-red-500">{errors.number}</p>}
                </div>
            </div>

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
                        placeholder="Bairro"
                        type="text"
                    />
                    {errors.neighborhood && <p className="text-xs text-red-500">{errors.neighborhood}</p>}
                </label>
                <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Complemento <span className="text-xs font-normal text-slate-400 ml-1">(Opcional)</span></span>
                    <input
                        value={formData.complement}
                        onChange={e => updateFormData({ complement: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Apto, Bloco, etc."
                        type="text"
                    />
                </label>
            </div>

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
                        className={`w-full rounded-lg border bg-slate-50 dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer appearance-none ${errors.state ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                    >
                        <option value="">UF</option>
                        {BR_STATES.map((uf) => (
                            <option key={uf} value={uf}>{uf}</option>
                        ))}
                    </select>
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                </label>
            </div>

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

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                {showBackButton && onCancel ? (
                    <button onClick={onCancel} className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium flex items-center justify-center gap-2 py-3 sm:py-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 sm:hover:bg-transparent">
                        <span className="material-symbols-outlined">arrow_back</span> {backButtonLabel}
                    </button>
                ) : (
                    <div className="hidden sm:block"></div> // Spacer
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
