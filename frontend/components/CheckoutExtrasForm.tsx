import React, { useState, useEffect } from 'react';
import { maskPhone } from '../src/lib/validation';

export interface ExtrasData {
    phone: string;
    email: string;
    notes: string;
    attachmentUrl?: string;
}

interface CheckoutExtrasFormProps {
    initialData: ExtrasData;
    onSubmit: (data: ExtrasData) => void;
    onCancel?: () => void;
    // External upload handler
    onUpload?: (file: File) => Promise<boolean>;
    isUploading?: boolean;
    uploadSuccess?: boolean;

    isSaving?: boolean;
    submitLabel?: string;
    showBackButton?: boolean;

    // Sections to show
    showContact?: boolean;
    showNotes?: boolean;
    showFiles?: boolean;
    backButtonLabel?: string;
}

export const CheckoutExtrasForm: React.FC<CheckoutExtrasFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    onUpload,
    isUploading = false,
    uploadSuccess = false,
    isSaving = false,
    submitLabel = 'Próxima Etapa',
    showBackButton = false,
    backButtonLabel = 'Voltar',
    showContact = true,
    showNotes = true,
    showFiles = true
}) => {
    const [formData, setFormData] = useState<ExtrasData>(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const updateFormData = (data: Partial<ExtrasData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = maskPhone(e.target.value);
        updateFormData({ phone: val });
        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
    };

    const handleSubmit = () => {
        if (showContact && !formData.phone) {
            setErrors({ phone: 'Telefone é obrigatório.' });
            return;
        }
        onSubmit(formData);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onUpload) {
            await onUpload(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_support</span>
                {showContact && showNotes ? 'Contato e Documentos' : showContact ? 'Informações de Contato' : 'Observações e Documentos'}
            </h2>

            {showContact && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone / WhatsApp <span className="text-red-500">*</span></span>
                        <input
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            maxLength={15}
                            className={`w-full rounded-lg border bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all ${errors.phone ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`}
                            placeholder="(00) 00000-0000"
                            type="tel"
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail <span className="text-xs font-normal text-slate-400">(Opcional)</span></span>
                        <input
                            value={formData.email}
                            onChange={(e) => updateFormData({ email: e.target.value })}
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 h-12 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            placeholder="seu@email.com"
                            type="email"
                        />
                    </label>
                </div>
            )}

            {showNotes && (
                <label className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações <span className="text-xs font-normal text-slate-400">(Opcional)</span></span>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => updateFormData({ notes: e.target.value })}
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 p-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none h-24"
                        placeholder="Ex: Deixar na portaria, campainha não funciona..."
                    ></textarea>
                </label>
            )}

            {showFiles && (
                <div className="flex flex-col gap-2 animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anexo da Receita <span className="text-xs font-normal text-slate-400">(Opcional) - PDF, JPG ou PNG - Max 10MB</span></span>
                    <label className={`border-2 border-dashed ${uploadSuccess || formData.attachmentUrl ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'} rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group`}>
                        {isUploading ? (
                            <span className="block size-8 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></span>
                        ) : (uploadSuccess || formData.attachmentUrl) ? (
                            <>
                                <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">Receita anexada com sucesso!</p>
                                <p className="text-xs text-green-600 dark:text-green-500 mt-1">Clique para substituir</p>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary mb-2 transition-colors">cloud_upload</span>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Clique ou arraste o arquivo aqui</p>
                                <p className="text-xs text-slate-400 mt-1">Nenhum arquivo selecionado</p>
                            </>
                        )}
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf, .jpg, .jpeg, .png"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
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
