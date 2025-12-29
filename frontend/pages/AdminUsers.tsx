import React, { useState } from 'react';

// Mock Data based on the image
const usersData = [
  { 
    id: 1, 
    name: 'Ana Clara Mendes', 
    userId: '#88392', 
    email: 'ana.mendes@farmacia.com', 
    role: 'Gerente', 
    roleColor: 'purple', 
    status: 'Ativo', 
    statusType: 'success',
    lastAccess: 'Hoje, 09:42', 
    avatar: 'https://picsum.photos/id/64/200' 
  },
  { 
    id: 2, 
    name: 'Roberto Carlos', 
    userId: '#99210', 
    email: 'roberto.c@farmacia.com', 
    role: 'Atendente', 
    roleColor: 'blue', 
    status: 'Offline', 
    statusType: 'neutral',
    lastAccess: 'Ontem, 18:30', 
    avatar: 'https://picsum.photos/id/65/200' 
  },
  { 
    id: 3, 
    name: 'Juliana Silva', 
    userId: '#10293', 
    email: 'juliana.s@farmacia.com', 
    role: 'Atendente', 
    roleColor: 'blue', 
    status: 'Bloqueado', 
    statusType: 'danger',
    lastAccess: '2 dias atrás', 
    avatar: 'https://picsum.photos/id/66/200',
    initials: 'JS'
  },
  { 
    id: 4, 
    name: 'Marcos Oliveira', 
    userId: '#00021', 
    email: 'admin@farmacia.com', 
    role: 'Administrador', 
    roleColor: 'amber', 
    status: 'Ativo', 
    statusType: 'success',
    lastAccess: 'Agora', 
    avatar: 'https://picsum.photos/id/68/200' 
  },
];

export const AdminUsers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const getRoleBadge = (role: string, color: string) => {
        let classes = '';
        switch(color) {
            case 'purple': classes = 'bg-purple-500/10 text-purple-400 border border-purple-500/20'; break;
            case 'blue': classes = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'; break;
            case 'amber': classes = 'bg-amber-500/10 text-amber-400 border border-amber-500/20'; break;
            default: classes = 'bg-slate-700 text-slate-300';
        }
        
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
                <span className={`size-1.5 rounded-full bg-current`}></span>
                {role}
            </span>
        );
    };

    const getStatusBadge = (status: string, type: string) => {
        if (type === 'success') {
             return <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500">{status}</span>;
        }
        if (type === 'danger') {
             return <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500">{status}</span>;
        }
        return <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-slate-700 text-slate-400">{status}</span>;
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Home</span>
                <span>/</span>
                <span className="text-white">Gerenciamento de Usuários</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Usuários do Sistema</h1>
                    <p className="text-slate-400 max-w-2xl">Administre o acesso e permissões dos atendentes e gerentes das filiais. Crie novos usuários ou edite os existentes.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all">
                    <span className="material-symbols-outlined">add</span>
                    Novo Usuário
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-500 text-[20px]">search</span>
                    </span>
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text" 
                        placeholder="Buscar por nome, e-mail ou CPF..." 
                        className="w-full bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>Filtros:</span>
                    </div>
                    <select className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[140px]">
                        <option>Cargo: Todos</option>
                        <option>Gerente</option>
                        <option>Atendente</option>
                        <option>Administrador</option>
                    </select>
                    <select className="bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[140px]">
                        <option>Status: Todos</option>
                        <option>Ativo</option>
                        <option>Offline</option>
                        <option>Bloqueado</option>
                    </select>
                    <button className="text-blue-500 font-bold text-sm flex items-center gap-1 hover:text-blue-400">
                        <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
                        Limpar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Cargo</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Último Acesso</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {usersData.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.initials ? (
                                                <div className="size-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-900">
                                                    {user.initials}
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <img src={user.avatar} alt={user.name} className="size-10 rounded-full object-cover border-2 border-slate-800" />
                                                    <span className={`absolute bottom-0 right-0 block size-2.5 rounded-full border-2 border-slate-900 ${user.statusType === 'success' ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-white">{user.name}</p>
                                                <p className="text-xs text-slate-500">ID: {user.userId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {getRoleBadge(user.role, user.roleColor)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(user.status, user.statusType)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{user.lastAccess}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                    <p className="text-sm text-slate-400">
                        Mostrando <span className="font-bold text-white">1</span> a <span className="font-bold text-white">4</span> de <span className="font-bold text-white">12</span> usuários
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">3</button>
                        <span className="text-slate-600 px-1">...</span>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};