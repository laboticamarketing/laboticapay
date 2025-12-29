import React, { useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

// Mock Data for Chart
const dailyData = [
  { day: '01 Out', value: 4200, highlight: false },
  { day: '05 Out', value: 3100, highlight: false },
  { day: '08 Out', value: 2500, highlight: false },
  { day: '10 Out', value: 8500, highlight: true }, // Highlighted Green
  { day: '15 Out', value: 5400, highlight: false },
  { day: '18 Out', value: 6200, highlight: false },
  { day: '20 Out', value: 4100, highlight: false },
  { day: '25 Out', value: 7800, highlight: true }, // Highlighted Green
  { day: '28 Out', value: 5900, highlight: false },
  { day: '30 Out', value: 4800, highlight: false },
];

// Mock Data for Transactions Table
const transactions = [
    { id: '#TRX-9921', client: 'Ana Souza', date: '25/10/2023', value: 'R$ 1.250,00', attendant: 'João Silva', status: 'Pago', color: 'green' },
    { id: '#TRX-9922', client: 'Carlos Lima', date: '25/10/2023', value: 'R$ 320,50', attendant: 'Maria Costa', status: 'Pendente', color: 'amber' },
    { id: '#TRX-9923', client: 'Roberto Dias', date: '24/10/2023', value: 'R$ 890,00', attendant: 'João Silva', status: 'Pago', color: 'green' },
    { id: '#TRX-9924', client: 'Fernanda M.', date: '24/10/2023', value: 'R$ 45,90', attendant: 'Ana Souza', status: 'Cancelado', color: 'red' },
    { id: '#TRX-9925', client: 'Julia P.', date: '23/10/2023', value: 'R$ 2.100,00', attendant: 'Pedro Lima', status: 'Pago', color: 'green' },
];

export const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState('2023-10-01');
  const [endDate, setEndDate] = useState('2023-10-31');

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                <span>Home</span>
                <span>/</span>
                <span>Gerência</span>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">Relatórios</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Relatórios Gerenciais</h1>
            <p className="text-slate-500 dark:text-slate-400">Visualize o desempenho financeiro, status de links e produtividade da equipe.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
         <div className="flex items-center gap-2 mb-4 text-primary font-bold">
            <span className="material-symbols-outlined">filter_list</span>
            <h3>Filtros de Busca</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 gap-4 items-end">
            <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Data Início</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>
            
            <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Data Fim</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-primary focus:border-primary"
                    />
                </div>
            </div>

            <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Atendente</label>
                <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                    <option>Todos os atendentes</option>
                    <option>João Silva</option>
                    <option>Maria Costa</option>
                    <option>Ana Souza</option>
                </select>
            </div>

             <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Pagamento</label>
                <select className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white px-3 py-2.5 text-sm focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                    <option>Todos os status</option>
                    <option>Pago</option>
                    <option>Pendente</option>
                    <option>Cancelado</option>
                </select>
            </div>

            <div className="lg:col-span-1">
                <button className="w-full h-[42px] bg-primary hover:bg-[#10d641] text-black font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                    <span className="hidden lg:inline">Atualizar</span>
                </button>
            </div>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturamento Total */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-lg bg-green-50 dark:bg-green-900/10 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined">attach_money</span>
                    </div>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +12.5%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Faturamento Total</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">R$ 145.230,00</p>
            </div>

            {/* Links Gerados */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined">link</span>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span> 0.0%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Links Gerados</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">342</p>
            </div>

             {/* Conversão */}
             <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-lg bg-purple-50 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <span className="material-symbols-outlined">percent</span>
                    </div>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span> +3.2%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Conversão</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">78.4%</p>
            </div>

            {/* Pendentes */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div className="size-10 rounded-lg bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <span className="material-symbols-outlined">hourglass_top</span>
                    </div>
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">trending_down</span> -2.1%
                    </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pendentes</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">R$ 12.450,00</p>
            </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Faturamento Diário</h3>
            <button className="text-sm font-bold text-primary hover:underline">Ver detalhes</button>
         </div>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} barSize={60}>
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`R$ ${value}`, 'Valor']}
                    />
                    <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        dy={10}
                    />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                        {dailyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.highlight ? '#13ec49' : '#f1f5f9'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
             <h3 className="font-bold text-lg text-slate-900 dark:text-white w-full md:w-auto">Detalhamento de Transações</h3>
             <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
                </span>
                <input 
                    type="text" 
                    placeholder="Buscar por cliente ou ID..." 
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-black/20 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
            </div>
         </div>

         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                 <thead>
                     <tr className="bg-slate-50 dark:bg-black/20 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                         <th className="px-6 py-4">ID Transação</th>
                         <th className="px-6 py-4">Cliente</th>
                         <th className="px-6 py-4">Data</th>
                         <th className="px-6 py-4">Atendente</th>
                         <th className="px-6 py-4">Valor</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Ação</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                     {transactions.map((trx, idx) => (
                         <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                             <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{trx.id}</td>
                             <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{trx.client}</td>
                             <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{trx.date}</td>
                             <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{trx.attendant}</td>
                             <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{trx.value}</td>
                             <td className="px-6 py-4">
                                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-${trx.color}-100 text-${trx.color}-700 dark:bg-${trx.color}-900/30 dark:text-${trx.color}-400`}>
                                     {trx.status}
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
         {/* Footer Pagination */}
         <div className="bg-white dark:bg-surface-dark px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">Mostrando <strong>5</strong> de <strong>120</strong> resultados</span>
            <div className="flex gap-2">
                <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Anterior</button>
                <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Próximo</button>
            </div>
         </div>
      </div>
    </div>
  );
};