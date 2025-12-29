import React, { useState } from 'react';

// Mock Data matching the screenshot
const logsData = [
  { 
    id: 1, 
    date: '12/05/2024', 
    time: '14:32:05', 
    severity: 'Crítica', 
    user: 'Sistema', 
    userType: 'system', // system, user, unknown, webhook
    event: 'Erro de Integração', 
    description: 'Falha de conexão com gateway de pagamento (Timeout).',
    errorDetail: 'Error: 504 Gateway Timeout at API /v1/transactions'
  },
  { 
    id: 2, 
    date: '12/05/2024', 
    time: '11:15:22', 
    severity: 'Alta', 
    user: 'Ricardo Santos', 
    userType: 'user', 
    avatar: 'https://picsum.photos/id/68/200',
    event: 'Configuração Alterada', 
    description: 'Alteração da taxa de juros global de 2.5% para 2.9%.',
    errorDetail: null
  },
  { 
    id: 3, 
    date: '12/05/2024', 
    time: '09:42:10', 
    severity: 'Média', 
    user: 'Desconhecido', 
    userType: 'unknown', 
    event: 'Falha de Login', 
    description: '3 tentativas consecutivas de login falharam para usuario: admin@...',
    errorDetail: 'IP: 192.168.1.45'
  },
  { 
    id: 4, 
    date: '12/05/2024', 
    time: '08:55:01', 
    severity: 'Baixa', 
    user: 'Amanda Oliveira', 
    userType: 'user', 
    avatar: 'https://picsum.photos/id/65/200',
    event: 'Link Gerado', 
    description: 'Gerou link de pagamento #8821 no valor de R$ 450,00 para Clien...',
    errorDetail: null
  },
  { 
    id: 5, 
    date: '12/05/2024', 
    time: '08:30:15', 
    severity: 'Sucesso', 
    user: 'Webhook', 
    userType: 'webhook', 
    event: 'Pedido Pago', 
    description: 'Status do pedido #4921 atualizado automaticamente para "Pago".',
    errorDetail: null
  },
  { 
    id: 6, 
    date: '11/05/2024', 
    time: '18:12:44', 
    severity: 'Baixa', 
    user: 'Amanda Oliveira', 
    userType: 'user',
    avatar: 'https://picsum.photos/id/65/200',
    event: 'Login Realizado', 
    description: 'Login bem-sucedido via Web Desktop. IP: 201.55.122.90',
    errorDetail: null
  },
];

export const AdminLogs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const getSeverityStyles = (severity: string) => {
        switch(severity) {
            case 'Crítica': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'Média': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Baixa': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Sucesso': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    const renderUserIcon = (log: any) => {
        if (log.userType === 'system') {
            return (
                <div className="size-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold text-xs border border-pink-500/30">
                    S
                </div>
            );
        }
        if (log.userType === 'webhook') {
            return (
                <div className="size-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center font-bold text-xs border border-green-500/30">
                    W
                </div>
            );
        }
        if (log.userType === 'unknown') {
            return (
                <div className="size-8 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-600">
                    ?
                </div>
            );
        }
        if (log.userType === 'user' && log.avatar) {
            return (
                <img src={log.avatar} alt={log.user} className="size-8 rounded-full object-cover border border-slate-700" />
            );
        }
        return (
            <div className="size-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                {log.user.charAt(0)}
            </div>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Home</span>
                <span>/</span>
                <span className="text-white">Logs de Auditoria</span>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Logs do Sistema</h1>
                    <p className="text-slate-400 max-w-2xl">Audite todas as operações realizadas na plataforma, incluindo criação de links, logins e alterações de configurações.</p>
                </div>
                <button className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    Exportar CSV
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4 relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Buscar</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-500 text-[18px]">search</span>
                            </span>
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                type="text" 
                                placeholder="ID, nome do usuário, descrição..." 
                                className="w-full bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Período</label>
                         <select className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                            <option>Últimos 7 dias</option>
                            <option>Hoje</option>
                            <option>Últimos 30 dias</option>
                            <option>Todo o período</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Tipo de Evento</label>
                         <select className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                            <option>Todos</option>
                            <option>Erro</option>
                            <option>Aviso</option>
                            <option>Info</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Severidade</label>
                         <select className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                            <option>Todas</option>
                            <option>Crítica</option>
                            <option>Alta</option>
                            <option>Média</option>
                            <option>Baixa</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                         <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Usuário</label>
                         <select className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
                            <option>Todos</option>
                            <option>Sistema</option>
                            <option>Ricardo Santos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Data & Hora</th>
                                <th className="px-6 py-4">Severidade</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Evento</th>
                                <th className="px-6 py-4 w-1/3">Descrição / Detalhes</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {logsData.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{log.date}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">{log.time}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getSeverityStyles(log.severity)}`}>
                                            {log.severity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {renderUserIcon(log)}
                                            <span className={`font-medium ${log.userType === 'unknown' ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                                                {log.user}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-300 font-medium">
                                        {log.event}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-slate-300">{log.description}</span>
                                            {log.errorDetail && (
                                                <code className="text-xs text-red-400 font-mono bg-red-950/30 px-2 py-1 rounded border border-red-900/50 w-fit block mt-1">
                                                    {log.errorDetail}
                                                </code>
                                            )}
                                            {log.userType === 'unknown' && log.errorDetail && log.errorDetail.includes('IP') && (
                                                <code className="text-xs text-green-400 font-mono bg-green-950/30 px-2 py-1 rounded border border-green-900/50 w-fit block mt-1">
                                                    {log.errorDetail}
                                                </code>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Ver detalhes">
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Pagination */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
                    <p className="text-sm text-slate-400">
                        Mostrando <span className="font-bold text-white">1</span> a <span className="font-bold text-white">6</span> de <span className="font-bold text-white">128</span> resultados
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">3</button>
                        <span className="text-slate-600 px-1">...</span>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white font-medium text-sm transition-colors">10</button>
                        <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};