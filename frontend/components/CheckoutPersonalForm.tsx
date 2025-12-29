import React, { useState, useEffect } from 'react';
import { validateCpf, maskCPF, maskDate, maskRG } from '../src/lib/validation';

export interface PersonalData {
    name: string;
    birthDate: string;
    cpf: string;
    rg: string;
}

interface CheckoutPersonalFormProps {
    initialData: PersonalData;
    onSubmit: (data: PersonalData) => void;
    onCancel?: () => void; // Optional for Step 1, required for Inline
    isSaving?: boolean;
    submitLabel?: string;
    showBackButton?: boolean; // For Inline "Cancel" button style or distinct back
    backButtonLabel?: string;
}

export const CheckoutPersonalForm: React.FC<CheckoutPersonalFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isSaving = false,
    submitLabel = 'Próxima Etapa',
    showBackButton = false,
    backButtonLabel = 'Voltar'
}) => {
    const [formData, setFormData] = useState<PersonalData>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'cpf') maskedValue = maskCPF(value);
        if (name === 'birthDate') maskedValue = maskDate(value);
        if (name === 'rg') maskedValue = maskRG(value);

        setFormData(prev => ({ ...prev, [name]: maskedValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Nome é obrigatório.';
        if (!formData.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória.';

        if (!formData.cpf) {
            newErrors.cpf = 'CPF é obrigatório.';
        } else if (!validateCpf(formData.cpf)) {
            newErrors.cpf = 'CPF inválido.';
        }

        if (!formData.rg) newErrors.rg = 'RG é obrigatório.';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSubmit(formData);
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Informações Pessoais
            </h2>

            <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo <span className="text-red-500">*</span></span>
                <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.name ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="Digite seu nome completo"
                    type="text"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col gap-2 relative">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nascimento <span className="text-red-500">*</span></span>
                    <input
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        maxLength={10}
                        className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.birthDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="DD/MM/AAAA"
                        type="text"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-10 text-slate-400 pointer-events-none">calendar_month</span>
                    {errors.birthDate && <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>}
                </label>

                <label className="flex flex-col gap-2 relative">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">CPF <span className="text-red-500">*</span></span>
                    <input
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        maxLength={14}
                        className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.cpf ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                        placeholder="000.000.000-00"
                        type="text"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-10 text-slate-400 pointer-events-none">id_card</span>
                    {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                </label>
            </div>

            <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RG <span className="text-red-500">*</span></span>
                <input
                    name="rg"
                    value={formData.rg}
                    onChange={handleChange}
                    maxLength={13}
                    className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.rg ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                    placeholder="00.000.000-0"
                    type="text"
                />
                {errors.rg && <p className="text-xs text-red-500">{errors.rg}</p>}
            </label>

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
