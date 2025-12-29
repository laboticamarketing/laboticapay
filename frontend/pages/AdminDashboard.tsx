import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data
const chartData = [
  { name: '01 Jun', value: 4000 },
  { name: '05 Jun', value: 3000 },
  { name: '08 Jun', value: 2000 },
  { name: '12 Jun', value: 2780 },
  { name: '15 Jun', value: 1890 },
  { name: '18 Jun', value: 2390 },
  { name: '22 Jun', value: 3490 },
  { name: '25 Jun', value: 4000 },
  { name: '29 Jun', value: 5000 },
  { name: '30 Jun', value: 6000 },
];

const auditLogs = [
  { id: 1, user: 'Fernanda S.', role: 'Atendente', action: 'Gerou novo link', details: 'Link #LNK-992 para J. Silva', time: '10:42' },
  { id: 2, user: 'Carlos Mendes', role: 'Gerente', action: 'Exportou Relatório', details: 'Relatório Mensal de Vendas', time: '09:15' },
  { id: 3, user: 'Roberto Almeida', role: 'Admin', action: 'Alteração de Sistema', details: 'Gateway Stone atualizado v2.4', time: 'Ontem' },
  { id: 4, user: 'Sistema', role: 'Automático', action: 'Backup Realizado', details: 'Backup diário do banco de dados', time: 'Ontem' },
];

export const AdminDashboard: React.FC = () => {
    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Visão Geral</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Controle e monitoramento em tempo real</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors border border-slate-700">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Gerar Relatório
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Novo Usuário
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 */}
                <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Receita Total (Mês)</p>
                            <h3 className="text-2xl font-bold text-white mt-1">R$ 342.500,00</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">account_balance_wallet</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span>+12% vs mês anterior</span>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Links Ativos</p>
                            <h3 className="text-2xl font-bold text-white mt-1">156</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">link</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span>+24 novos hoje</span>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Taxa de Sucesso</p>
                            <h3 className="text-2xl font-bold text-white mt-1">98.2%</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                        <span>+0.5% otimização</span>
                    </div>
                </div>

                {/* Card 4 */}
                <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Gateway Principal</p>
                            <h3 className="text-2xl font-bold text-white mt-1">Operacional</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <span className="material-symbols-outlined">router</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">verified</span>
                        <span>API Stone v2.4</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-white">Volume Financeiro</h3>
                            <p className="text-slate-400 text-sm">Processado nos últimos 30 dias</p>
                        </div>
                        <div className="flex bg-slate-800 rounded-lg p-0.5">
                            <button className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-md">30 Dias</button>
                            <button className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white">6 Meses</button>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{ stroke: '#475569', strokeDasharray: '5 5' }}
                                />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column Widgets */}
                <div className="flex flex-col gap-6">
                    {/* Gateways */}
                    <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Gateways de Pagamento</h3>
                            <button className="text-blue-500 text-xs font-bold hover:underline">Configurar</button>
                        </div>
                        <div className="space-y-4">
                             {/* Stone */}
                             <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Stone Pagamentos</p>
                                        <p className="text-xs text-slate-400">Online • 45ms</p>
                                    </div>
                                </div>
                                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                             </div>
                             {/* Cielo */}
                             <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Cielo API V3</p>
                                        <p className="text-xs text-slate-400">Online • 52ms</p>
                                    </div>
                                </div>
                                <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                             </div>
                             {/* PagSeguro */}
                             <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                        <span className="material-symbols-outlined text-[18px]">build</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">PagSeguro</p>
                                        <p className="text-xs text-slate-400">Manutenção Programada</p>
                                    </div>
                                </div>
                                <div className="size-2 rounded-full bg-yellow-500"></div>
                             </div>
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-slate-900 dark:bg-surface-dark p-6 rounded-xl border border-slate-800 shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Equipe Ativa</h3>
                            <span className="text-xs text-slate-500">Hoje</span>
                        </div>
                        <div className="flex items-center -space-x-3 mb-4">
                            {[1,2,3,4].map(i => (
                                <img key={i} className="size-10 rounded-full border-2 border-slate-900" src={`https://picsum.photos/id/${60+i}/200`} alt="User" />
                            ))}
                            <div className="size-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                +24
                            </div>
                        </div>
                        <div>
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Capacidade Operacional</span>
                                <span className="text-white font-bold">75%</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Section */}
            <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                     <h3 className="font-bold text-lg text-white w-full md:w-auto">Logs de Auditoria Recentes</h3>
                     <div className="relative w-full md:w-96">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Buscar logs por usuário ou ação..." 
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-400 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Cargo</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Detalhes</th>
                                <th className="px-6 py-4 text-right">Horário</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {auditLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">{log.user}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                            {log.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-blue-400">{log.action}</td>
                                    <td className="px-6 py-4 text-slate-400">{log.details}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{log.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};