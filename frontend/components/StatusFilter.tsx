import React from 'react';

interface StatusFilterProps {
    filter: string;
    onChange: (filter: string) => void;
    className?: string;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({ filter, onChange, className = '' }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">Status:</span>
            <div className="flex gap-1">
                <button
                    onClick={() => onChange('Todos')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === 'Todos' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => onChange('PENDING')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === 'PENDING' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'}`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => onChange('PAID')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === 'PAID' ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'}`}
                >
                    Confirmados
                </button>
            </div>
        </div>
    );
};
