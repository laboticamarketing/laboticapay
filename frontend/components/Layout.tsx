import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  role: 'attendant' | 'manager' | 'admin';
  setRole: (role: 'attendant' | 'manager' | 'admin') => void;
}

export const Layout: React.FC<LayoutProps> = ({ role, setRole }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      <Sidebar role={role} setRole={setRole} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Mobile Header - Sticky and visible only on mobile/tablet (lg:hidden) */}
        <div className="lg:hidden bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="size-8 text-primary flex items-center justify-center bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined">local_pharmacy</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">FarmaPay</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>

        {/* Top Role Switcher - Hidden on Mobile/Tablet (hidden lg:flex) */}
        {/* Top Role Switcher - Hidden momentarily */}
        {/* <div className="hidden lg:flex bg-slate-900 text-white px-4 sm:px-6 py-2 items-center justify-between z-10 shadow-md shrink-0 overflow-x-auto">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap mr-4 hidden sm:block">Modo de Visualização</div>
            <div className="flex bg-slate-800 rounded-lg p-1 gap-1 min-w-max mx-auto sm:mx-0">
                <button 
                    onClick={() => setRole('attendant')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${role === 'attendant' ? 'bg-primary text-black shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    <span className="hidden sm:inline">Atendente</span>
                </button>
                <button 
                    onClick={() => setRole('manager')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${role === 'manager' ? 'bg-primary text-black shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span className="hidden sm:inline">Gerente</span>
                </button>
                <button 
                    onClick={() => setRole('admin')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${role === 'admin' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <span className="material-symbols-outlined text-[16px]">shield_person</span>
                    <span className="hidden sm:inline">Admin</span>
                </button>
                
                <div className="w-px bg-slate-700 mx-1"></div>

                <button 
                    onClick={() => navigate('/checkout')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700`}
                >
                    <span className="material-symbols-outlined text-[16px]">shopping_cart_checkout</span>
                    <span className="hidden sm:inline">Checkout</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </button>
            </div>
        </div> */}

        <div className="h-full overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};