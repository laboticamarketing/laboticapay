import React, { useState } from 'react';

// Mock Data matching the provided design
const teamMembers = [
  {
    id: 1,
    name: 'Ana Souza',
    role: 'Comercial Pleno',
    email: 'ana.s@farmacia.com',
    phone: '(11) 98765-4321',
    sales: 32000,
    target: 40000,
    links: 342,
    status: 'Ativo',
    avatar: 'https://picsum.photos/id/64/200',
    statusColor: 'green'
  },
  {
    id: 2,
    name: 'João Silva',
    role: 'Comercial Senior',
    email: 'joao.s@farmacia.com',
    phone: '(11) 99887-1122',
    sales: 48000,
    target: 50000,
    links: 415,
    status: 'Ativo',
    avatar: 'https://picsum.photos/id/65/200',
    statusColor: 'green'
  },
  {
    id: 3,
    name: 'Maria Costa',
    role: 'Comercial Junior',
    email: 'maria.c@farmacia.com',
    phone: '(21) 97777-6655',
    sales: 18000,
    target: 25000,
    links: 220,
    status: 'Ausente',
    avatar: 'https://picsum.photos/id/66/200',
    statusColor: 'yellow'
  },
  {
    id: 4,
    name: 'Pedro Lima',
    role: 'Estagiário',
    email: 'pedro.l@farmacia.com',
    phone: '(31) 91234-5678',
    sales: 14000,
    target: 20000,
    links: 180,
    status: 'Inativo',
    avatar: 'https://picsum.photos/id/67/200',
    statusColor: 'slate'
  }
];

export const Team: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerenciamento de Equipe</h1>
                <button className="flex items-center gap-2 bg-primary hover:bg-[#10d641] text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm shadow-green-500/20 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Adicionar Atendente
                </button>
            </div>

            {/* Intro */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Membros da Equipe</h2>
                <p className="text-slate-500 text-sm mt-1">Gerencie perfis, permissões e acompanhe o desempenho individual.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card 1 */}
                 <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-14 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                         <span className="material-symbols-outlined text-[28px]">groups</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Atendentes</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">12</p>
                    </div>
                 </div>

                 {/* Card 2 */}
                 <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-14 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                         <span className="material-symbols-outlined text-[28px]">check_circle</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Ativos Hoje</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">10</p>
                    </div>
                 </div>

                 {/* Card 3 */}
                 <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="size-14 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                         <span className="material-symbols-outlined text-[28px]">person_add</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Novos (Este mês)</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">2</p>
                    </div>
                 </div>
            </div>

            {/* Toolbar */}
             <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400">search</span>
                   </div>
                   <input 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm" 
                      placeholder="Buscar por nome ou email..." 
                      type="text"
                   />
                </div>
                <div className="w-full md:w-48">
                    <select className="block w-full pl-3 pr-10 py-2.5 text-base border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg bg-slate-50 dark:bg-black/20 text-slate-700 dark:text-slate-300">
                        <option>Todos os Status</option>
                        <option>Ativo</option>
                        <option>Ausente</option>
                        <option>Inativo</option>
                    </select>
                </div>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm">
                    <span className="material-symbols-outlined text-[20px]">sort</span>
                    Ordenar
                </button>
             </div>

            {/* Table */}
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-black/20">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Colaborador</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Métricas (Mês)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface-dark">
                            {teamMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <img className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" src={member.avatar} alt={member.name} />
                                                <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-surface-dark ${
                                                    member.status === 'Ativo' ? 'bg-green-500' :
                                                    member.status === 'Ausente' ? 'bg-yellow-500' : 'bg-slate-400'
                                                }`} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{member.role}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">mail</span>
                                                {member.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                <span className="material-symbols-outlined text-[14px] text-slate-400">call</span>
                                                {member.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1 w-32">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">Vendas</span>
                                                <span className="font-bold text-slate-900 dark:text-white">R$ {member.sales / 1000}k</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${
                                                        member.statusColor === 'green' ? 'bg-primary' : 
                                                        member.statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-slate-400'
                                                    }`} 
                                                    style={{ width: `${(member.sales / member.target) * 100}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">{member.links} links gerados</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                            member.status === 'Ativo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            member.status === 'Ausente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {member.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">block</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Pagination */}
                 <div className="bg-white dark:bg-surface-dark px-4 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Mostrando <span className="font-bold text-slate-900 dark:text-white">4</span> de <span className="font-bold text-slate-900 dark:text-white">12</span> atendentes
                            </p>
                        </div>
                        <div className="flex gap-2">
                             <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                 Anterior
                             </button>
                             <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                 Próximo
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};