import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell, PieChart, Pie, Label } from 'recharts';

// Mock Data
const teamPerformance = [
    { id: 1, name: 'Ana Souza', email: 'ana.s@farmacia.com', generated: 342, total: 'R$ 32.450,00', ticket: 'R$ 94,88', status: 'Ativo', avatar: 'https://picsum.photos/id/64/200' },
    { id: 2, name: 'João Silva', email: 'joao.s@farmacia.com', generated: 415, total: 'R$ 48.120,00', ticket: 'R$ 115,95', status: 'Ativo', avatar: 'https://picsum.photos/id/65/200' },
    { id: 3, name: 'Maria Costa', email: 'maria.c@farmacia.com', generated: 150, total: 'R$ 12.300,00', ticket: 'R$ 82,00', status: 'Inativo', avatar: 'https://picsum.photos/id/66/200' },
    { id: 4, name: 'Pedro Alves', email: 'pedro.a@farmacia.com', generated: 280, total: 'R$ 25.600,00', ticket: 'R$ 91,42', status: 'Ativo', avatar: 'https://picsum.photos/id/67/200' },
    { id: 5, name: 'Lucas Lima', email: 'lucas.l@farmacia.com', generated: 390, total: 'R$ 38.900,00', ticket: 'R$ 99,74', status: 'Férias', avatar: 'https://picsum.photos/id/68/200' },
];

const barData = [
    { name: 'Ana', value: 55, color: '#13ec49' },
    { name: 'João', value: 85, color: '#13ec49' },
    { name: 'Maria', value: 35, color: '#13ec49' },
    { name: 'Pedro', value: 25, color: '#bbf7cb' },
    { name: 'Lucas', value: 65, color: '#13ec49' },
];

const pieData = [
    { name: 'Pagos', value: 75, fill: '#13ec49' },
    { name: 'Pendentes', value: 15, fill: '#facc15' },
    { name: 'Expirados', value: 10, fill: '#e2e8f0' },
];

export const ManagerDashboard: React.FC = () => {
    const [dateFilter, setDateFilter] = useState('7 Dias');

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard do Gerente</h1>
                <div className="flex gap-4 items-center">
                    <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
                        {['Hoje', '7 Dias', 'Mês'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setDateFilter(filter)}
                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${dateFilter === filter ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 bg-primary hover:bg-[#10d641] text-slate-900 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Exportar Relatório
                    </button>
                </div>
            </div>

            {/* Overview Section */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Visão Geral</h2>
                <p className="text-slate-500 text-sm mb-6">Acompanhe a performance da equipe de vendas em tempo real.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1 */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                <span className="material-symbols-outlined">attach_money</span>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span> +12%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Vendas (Mês)</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">R$ 125.400</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined">link</span>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span> +5%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Links Gerados</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">1.450</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <span className="material-symbols-outlined">pie_chart</span>
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_up</span> +2%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Conversão</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">85%</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined">receipt_long</span>
                            </div>
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[14px]">trending_down</span> -1%
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Ticket Médio</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">R$ 86,50</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Vendas por Atendente</h3>
                        <button className="text-primary text-sm font-medium hover:underline">Ver completo</button>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barSize={60}>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    dy={10}
                                />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Status dos Links</h3>
                         <span className="material-symbols-outlined text-slate-400 cursor-pointer">more_horiz</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={0}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                        <Label 
                                            value="1.45k" 
                                            position="center" 
                                            className="text-3xl font-bold fill-slate-900 dark:fill-white"
                                            dy={-10}
                                        />
                                        <Label 
                                            value="Total" 
                                            position="center" 
                                            className="text-sm fill-slate-500"
                                            dy={15}
                                        />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                         <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-[#13ec49]"></div>
                                <span className="text-slate-600 dark:text-slate-300">Pagos</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">75%</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-[#facc15]"></div>
                                <span className="text-slate-600 dark:text-slate-300">Pendentes</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">15%</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-[#e2e8f0]"></div>
                                <span className="text-slate-600 dark:text-slate-300">Expirados</span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">10%</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Team Performance Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                 <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                     <h3 className="font-bold text-lg text-slate-900 dark:text-white w-full md:w-auto">Desempenho da Equipe</h3>
                     <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                            </span>
                            <input 
                                type="text" 
                                placeholder="Buscar atendente..." 
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
                             <span className="material-symbols-outlined">filter_list</span>
                        </button>
                     </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                         <thead>
                             <tr className="bg-slate-50 dark:bg-black/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                 <th className="px-6 py-4">Atendente</th>
                                 <th className="px-6 py-4 text-center">Links Gerados</th>
                                 <th className="px-6 py-4 text-center">Valor Total</th>
                                 <th className="px-6 py-4 text-center">Ticket Médio</th>
                                 <th className="px-6 py-4 text-center">Status</th>
                                 <th className="px-6 py-4 text-right">Ação</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                             {teamPerformance.map((member) => (
                                 <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center gap-3">
                                             <img src={member.avatar} alt={member.name} className="size-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                             <div>
                                                 <p className="font-bold text-slate-900 dark:text-white">{member.name}</p>
                                                 <p className="text-xs text-slate-500">{member.email}</p>
                                             </div>
                                         </div>
                                     </td>
                                     <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{member.generated}</td>
                                     <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">{member.total}</td>
                                     <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">{member.ticket}</td>
                                     <td className="px-6 py-4 text-center">
                                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                             member.status === 'Ativo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                             member.status === 'Férias' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                             'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                         }`}>
                                             <span className={`size-1.5 rounded-full ${
                                                 member.status === 'Ativo' ? 'bg-green-500' :
                                                 member.status === 'Férias' ? 'bg-blue-500' :
                                                 'bg-slate-400'
                                             }`}></span>
                                             {member.status}
                                         </span>
                                     </td>
                                     <td className="px-6 py-4 text-right">
                                         <button className="text-slate-400 hover:text-primary transition-colors">
                                             <span className="material-symbols-outlined text-[20px]">visibility</span>
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>
        </div>
    );
};