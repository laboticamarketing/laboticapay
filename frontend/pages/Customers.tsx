import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { customerService } from '../src/services/customer.service';
import { CreateCustomerDTO, Customer } from '../src/types/customer.types';

// --- Mask Utils (Local) ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

export const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [scope, setScope] = useState<'me' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await customerService.list({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        scope
      });
      setCustomers(response.data);
      setTotalCustomers(response.meta.total);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchTerm, scope]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, scope]);

  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

  return (
    <>
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Clientes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua base de clientes e visualize históricos.</p>
          </div>
          <button
            onClick={() => navigate('/customer-edit')}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-[#10d641] text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm shadow-green-500/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Novo Cliente</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full sm:max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-background-light dark:bg-background-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Buscar por nome, email ou CPF..."
              type="text"
            />
          </div>

          {/* Scope Toggle */}
          <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-lg">
            <button
              onClick={() => setScope('all')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${scope === 'all' ? 'bg-white dark:bg-surface-light shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Todos
            </button>
            <button
              onClick={() => setScope('me')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${scope === 'me' ? 'bg-white dark:bg-surface-light shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              Meus Clientes
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome / Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">CPF / Telefone</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Criado por</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-surface-light dark:bg-surface-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">Carregando...</td>
                  </tr>
                ) : customers.length > 0 ? (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm mr-3">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{customer.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{customer.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 dark:text-white">{customer.cpf || '-'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">
                        {customer.createdBy ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                            <span className="material-symbols-outlined text-[14px]">face</span>
                            {customer.createdBy.name?.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sistema / Legado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate('/customer-profile/' + customer.id)}
                          className="text-primary hover:text-green-700 dark:hover:text-green-300 font-bold text-sm flex items-center justify-end gap-1 ml-auto"
                        >
                          Ver Perfil
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">search_off</span>
                      <p>Nenhum cliente encontrado.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total de <span className="font-bold text-slate-900 dark:text-white">{totalCustomers}</span> resultados
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
                    disabled={currentPage === totalPages}
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
    </>
  );
};