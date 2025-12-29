import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerService } from '../src/services/customer.service';
import { Address } from '../src/types/customer.types';
import { validateCpf } from '../src/lib/validation';

// --- Mask Utils ---
const maskCPF = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskDate = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{4})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

const BR_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface FormAddress {
    id: number | string; // Helper for frontend list
    backendId?: string; // Real ID from backend
    type: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    district: string;
    city: string;
    state: string;
    isPrimary?: boolean;
}

export const CustomerEdit: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);

    // State for Customer Info
    const [customer, setCustomer] = useState({
        name: '',
        cpf: '',
        birthDate: '',
        email: '',
        phone: '',
        notes: ''
    });

    // State for Addresses (Array)
    const [addresses, setAddresses] = useState<FormAddress[]>([
        {
            id: 1,
            type: 'Casa',
            cep: '',
            street: '',
            number: '',
            complement: '',
            district: '',
            city: '',
            state: '',
            isPrimary: true
        }
    ]);

    useEffect(() => {
        if (isEditMode && id) {
            const fetchCustomer = async () => {
                try {
                    setLoading(true);
                    const data = await customerService.getById(id);

                    setCustomer({
                        name: data.name,
                        cpf: data.cpf || '',
                        birthDate: data.birthDate ? new Date(data.birthDate).toLocaleDateString('pt-BR') : '',
                        email: data.email || '',
                        phone: data.phone,
                        notes: data.notes || ''
                    });

                    // Map backend addresses to frontend form addresses
                    if (data.addresses && data.addresses.length > 0) {
                        // Logic to ensure only ONE primary is loaded (newest)
                        const activePrimaryId = data.addresses.find(a => a.isPrimary)?.id;

                        setAddresses(data.addresses.map((addr, index) => ({
                            id: index + 1, // Use index as temp ID for frontend keys
                            backendId: addr.id,
                            type: addr.type,
                            cep: addr.zip,
                            street: addr.street,
                            number: addr.number,
                            complement: addr.complement || '',
                            district: addr.neighborhood,
                            city: addr.city,
                            state: addr.state,
                            isPrimary: addr.id === activePrimaryId
                        })));
                    } else {
                        // Keep default empty address if none found
                    }

                } catch (error) {
                    console.error('Failed to fetch customer', error);
                    toast.error('Erro ao carregar dados do cliente.');
                } finally {
                    setLoading(false);
                }
            };
            fetchCustomer();
        }
    }, [id, isEditMode]);

    // Handlers for Customer Info
    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'cpf') maskedValue = maskCPF(value);
        if (name === 'birthDate') maskedValue = maskDate(value);
        if (name === 'phone') maskedValue = maskPhone(value);

        setCustomer(prev => ({ ...prev, [name]: maskedValue }));
    };

    // Handlers for Addresses
    // Handlers for Addresses
    const fetchCep = async (id: number | string, cep: string) => {
        try {
            const cleanCep = cep.replace(/\D/g, '');
            const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await res.json();

            if (!data.erro) {
                setAddresses(prev => prev.map(addr =>
                    addr.id === id ? {
                        ...addr,
                        street: data.logradouro,
                        district: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    } : addr
                ));
                toast.success('Endereço encontrado!');
            }
        } catch (error) {
            console.error('Error fetching CEP', error);
        }
    };

    const handleAddressChange = (id: number | string, field: string, value: string) => {
        let finalValue = value;

        if (field === 'cep') {
            finalValue = maskCEP(value);
            const cleanCep = finalValue.replace(/\D/g, '');
            if (cleanCep.length === 8) {
                fetchCep(id, cleanCep);
            }
        }

        setAddresses(prev => prev.map(addr =>
            addr.id === id ? { ...addr, [field]: finalValue } : addr
        ));
    };

    const handleAddressTypeChange = (id: number | string, newType: string) => {
        setAddresses(prev => prev.map(addr =>
            addr.id === id ? { ...addr, type: newType } : addr
        ));
    };

    const handleSetPrimaryAddress = (id: number | string) => {
        setAddresses(prev => prev.map(addr => ({
            ...addr,
            isPrimary: addr.id === id
        })));
    };

    const handleAddAddress = () => {
        const newId = addresses.length > 0 ? Math.max(...addresses.map(a => Number(a.id))) + 1 : 1;
        setAddresses([
            ...addresses,
            {
                id: newId,
                type: 'Casa',
                cep: '',
                street: '',
                number: '',
                complement: '',
                district: '',
                city: '',
                state: '',
                isPrimary: false
            }
        ]);
    };

    const handleRemoveAddress = (id: number | string) => {
        if (addresses.length === 1) {
            toast.error("O cliente deve ter pelo menos um endereço.");
            return;
        }

        if (window.confirm('Tem certeza que deseja remover este endereço?')) {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!customer.name || !customer.phone) {
            toast.error('Nome e Telefone são obrigatórios.');
            return;
        }

        if (customer.cpf && !validateCpf(customer.cpf)) {
            toast.error('CPF inválido.');
            return;
        }

        const payloadAddresses: Address[] = addresses.map(addr => ({
            type: addr.type,
            zip: addr.cep,
            street: addr.street,
            number: addr.number,
            neighborhood: addr.district,
            city: addr.city,
            state: addr.state,
            complement: addr.complement,
            isPrimary: addr.isPrimary || false
        }));

        // Format Date to ISO if present
        let birthDateISO = undefined;
        if (customer.birthDate) {
            const parts = customer.birthDate.split('/');
            if (parts.length === 3) {
                birthDateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        const payload = {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            cpf: customer.cpf,
            notes: customer.notes,
            birthDate: birthDateISO,
            addresses: payloadAddresses
        };

        try {
            if (isEditMode && id) {
                await customerService.update(id, payload);
                toast.success('Cliente atualizado com sucesso!');
            } else {
                await customerService.create(payload);
                toast.success('Cliente cadastrado com sucesso!');
            }
            navigate('/customers');
        } catch (error: any) {
            console.error('Save error:', error);
            if (error.response?.status === 409) {
                toast.error('CPF já cadastrado no sistema.');
            } else {
                toast.error('Erro ao salvar cliente.');
            }
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Carregando...</div>;
    }

    return (
        <div className="max-w-[960px] mx-auto p-4 md:p-8 flex flex-col gap-6 pb-32 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <button onClick={() => navigate(-1)} className="hover:text-primary transition-colors">Voltar</button>
                        <span>/</span>
                        <span className="text-slate-900 dark:text-white font-medium">{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{isEditMode ? 'Editar Dados' : 'Novo Cadastro'}</h1>
                </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-6">
                {/* Personal Info */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">person</span>
                        Dados Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Nome Completo</label>
                            <input
                                name="name"
                                value={customer.name}
                                onChange={handleInfoChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">CPF</label>
                            <input
                                name="cpf"
                                maxLength={14}
                                value={customer.cpf}
                                onChange={handleInfoChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Data de Nascimento</label>
                            <input
                                name="birthDate"
                                maxLength={10}
                                value={customer.birthDate}
                                onChange={handleInfoChange}
                                placeholder="DD/MM/AAAA"
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">contact_phone</span>
                        Contatos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                value={customer.email}
                                onChange={handleInfoChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">WhatsApp / Celular</label>
                            <input
                                type="tel"
                                name="phone"
                                maxLength={15}
                                value={customer.phone}
                                onChange={handleInfoChange}
                                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Addresses Info (Dynamic) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">home</span>
                            Endereços
                        </h2>
                        <button
                            type="button"
                            onClick={handleAddAddress}
                            className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Adicionar Endereço
                        </button>
                    </div>

                    {addresses.map((address, index) => (
                        <div key={address.id} className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative animate-in slide-in-from-bottom-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider hidden sm:block">Endereço {index + 1}</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="primaryAddress"
                                            checked={!!address.isPrimary}
                                            onChange={() => handleSetPrimaryAddress(address.id)}
                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        <span className={`text-xs font-bold ${address.isPrimary ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                                            {address.isPrimary ? 'Principal' : 'Marcar como Principal'}
                                        </span>
                                    </label>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center mt-3 sm:mt-0">
                                    {/* Address Type Selector */}
                                    <div className="flex bg-slate-50 dark:bg-black/20 p-1 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => handleAddressTypeChange(address.id, 'Casa')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${address.type === 'Casa' ? 'bg-blue-100 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} `}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">home</span>
                                            Casa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddressTypeChange(address.id, 'Trabalho')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${address.type === 'Trabalho' ? 'bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-900/40 dark:text-purple-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} `}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">work</span>
                                            Trabalho
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleAddressTypeChange(address.id, 'Outro')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${address.type === 'Outro' ? 'bg-amber-100 text-amber-700 shadow-sm dark:bg-amber-900/40 dark:text-amber-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} `}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">place</span>
                                            Outro
                                        </button>
                                    </div>

                                    {addresses.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveAddress(address.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Remover endereço"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">CEP</label>
                                    <input
                                        value={address.cep}
                                        onChange={(e) => handleAddressChange(address.id, 'cep', e.target.value)}
                                        maxLength={9}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Rua / Avenida</label>
                                    <input
                                        value={address.street}
                                        onChange={(e) => handleAddressChange(address.id, 'street', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Número</label>
                                    <input
                                        value={address.number}
                                        onChange={(e) => handleAddressChange(address.id, 'number', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                                        Complemento <span className="text-xs font-normal text-slate-400 ml-1">(Opcional)</span>
                                    </label>
                                    <input
                                        value={address.complement}
                                        onChange={(e) => handleAddressChange(address.id, 'complement', e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 h-11 px-4 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                        placeholder="Apto, Bloco, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Bairro</label>
                                    <input
                                        value={address.district}
                                        onChange={(e) => handleAddressChange(address.id, 'district', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Cidade</label>
                                    <input
                                        value={address.city}
                                        onChange={(e) => handleAddressChange(address.id, 'city', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Estado (UF)</label>
                                    <select
                                        value={address.state}
                                        onChange={(e) => handleAddressChange(address.id, 'state', e.target.value)}
                                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer"
                                    >
                                        <option value="">Selecione</option>
                                        {BR_STATES.map((uf) => (
                                            <option key={uf} value={uf}>{uf}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Notes */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">sticky_note_2</span>
                        Observações Internas
                    </h2>
                    <textarea
                        name="notes"
                        value={customer.notes}
                        onChange={handleInfoChange}
                        className="w-full h-32 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 p-4 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    ></textarea>
                </div>

                {/* Space for fixed footer */}
                <div className="h-24"></div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end gap-3 z-10 shadow-lg">
                    <button
                        type="button"
                        onClick={() => navigate('/customer-profile')}
                        className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
};