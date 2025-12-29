import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../src/services/auth.service';

interface SidebarProps {
    role: 'attendant' | 'manager' | 'admin';
    setRole: (role: 'attendant' | 'manager' | 'admin') => void;
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role, setRole, isOpen, onClose }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await authService.getProfile();
                setUser(data);
            } catch (error) {
                console.error('Failed to fetch profile', error);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        navigate('/login');
    };

    const getSystemInfo = () => {
        switch (role) {
            case 'admin':
                return {
                    title: 'AdminPanel',
                    subtitle: 'Controle Total',
                    colorClass: 'bg-blue-600 text-white',
                    icon: 'shield'
                };
            case 'manager':
                return {
                    title: 'FarmaLink',
                    subtitle: 'Painel Gerencial',
                    colorClass: 'bg-slate-900 text-white',
                    icon: 'bar_chart_4_bars'
                };
            default:
                return {
                    title: 'La Botica Pay',
                    subtitle: 'Área do Atendente',
                    colorClass: 'bg-transparent',
                    icon: 'local_pharmacy', // We will ignore this and use image
                    isImage: true
                };
        }
    };

    const systemInfo = getSystemInfo();

    // Handle closing sidebar when a link is clicked on mobile/tablet
    const handleLinkClick = () => {
        onClose();
    };

    const userDisplayName = user?.name ? user.name.split(' ')[0] : 'Carregando...';
    const userDisplayRole = user?.role === 'ATTENDANT' ? 'Atendente' : user?.role === 'MANAGER' ? 'Gerente' : user?.role === 'ADMIN' ? 'Administrador' : 'Usuário';
    const userAvatar = user?.avatarUrl || 'https://picsum.photos/id/64/200';

    return (
        <>
            {/* Mobile/Tablet Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
                    onClick={onClose}
                />
            )}

            <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 h-screen 
            bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 
            flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:inset-auto lg:z-auto
            ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
                {/* Mobile/Tablet Close Button */}
                <div className="lg:hidden absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="flex items-center gap-3 mb-8">
                        <div className={`rounded-xl size-12 flex items-center justify-center overflow-hidden ${systemInfo.colorClass}`}>
                            {systemInfo.title === 'La Botica Pay' ? (
                                <img src="/logo.png" alt="Logo" className="size-full object-contain" />
                            ) : (
                                <span className="material-symbols-outlined">{systemInfo.icon}</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-normal">
                                {systemInfo.title}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">
                                {systemInfo.subtitle}
                            </p>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2">

                        {/* Menu for Administrator (Disabled for MVP) */}
                        {/* 
                        {role === 'admin' && (
                            <>
                                <NavLink onClick={handleLinkClick} to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined icon-filled">grid_view</span>
                                    <p className="text-sm leading-normal">Dashboard</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">group</span>
                                    <p className="text-sm font-medium leading-normal">Gerenciamento de Usuários</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/system-settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">settings_applications</span>
                                    <p className="text-sm font-medium leading-normal">Configurações do Sistema</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/audit-logs" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">assignment</span>
                                    <p className="text-sm font-medium leading-normal">Logs de Auditoria</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/financial-reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">request_quote</span>
                                    <p className="text-sm font-medium leading-normal">Relatórios Financeiros</p>
                                </NavLink>
                            </>
                        )}
                        */}

                        {/* Menu for Manager (Disabled for MVP) */}
                        {/* 
                        {role === 'manager' && (
                            <>
                                <NavLink onClick={handleLinkClick} to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined icon-filled">dashboard</span>
                                    <p className="text-sm leading-normal">Dashboard</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/team" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">groups</span>
                                    <p className="text-sm font-medium leading-normal">Equipe</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">bar_chart</span>
                                    <p className="text-sm font-medium leading-normal">Relatórios</p>
                                </NavLink>
                                <NavLink onClick={handleLinkClick} to="/links" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                    <span className="material-symbols-outlined">payments</span>
                                    <p className="text-sm font-medium leading-normal">Links de Pagamento</p>
                                </NavLink>

                                <div className="pt-4 mt-2 mb-2 border-t border-slate-100 dark:border-slate-800">
                                    <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sistema</p>
                                    <NavLink onClick={handleLinkClick} to="/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-white font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                        <span className="material-symbols-outlined">settings</span>
                                        <p className="text-sm font-medium leading-normal">Configurações</p>
                                    </NavLink>
                                </div>
                            </>
                        )}

                        {/* Menu for Attendant */}
                        {role === 'attendant' && (
                            <>
                                <NavLink
                                    onClick={handleLinkClick}
                                    to="/"
                                    end
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-green-800 dark:text-primary font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined">dashboard</span>
                                    <p className="text-sm leading-normal">Dashboard</p>
                                </NavLink>

                                <NavLink
                                    onClick={handleLinkClick}
                                    to="/new-link"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-green-800 dark:text-primary font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined">add_link</span>
                                    <p className="text-sm font-medium leading-normal">Novo Link</p>
                                </NavLink>

                                <NavLink
                                    onClick={handleLinkClick}
                                    to="/links"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-green-800 dark:text-primary font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined">list_alt</span>
                                    <p className="text-sm font-medium leading-normal">Links Gerados</p>
                                </NavLink>

                                <NavLink
                                    onClick={handleLinkClick}
                                    to="/customers"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-green-800 dark:text-primary font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined">group</span>
                                    <p className="text-sm font-medium leading-normal">Clientes</p>
                                </NavLink>

                                <NavLink
                                    onClick={handleLinkClick}
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                            ? 'bg-primary/10 text-green-800 dark:text-primary font-bold'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined">person</span>
                                    <p className="text-sm font-medium leading-normal">Perfil</p>
                                </NavLink>
                            </>
                        )}
                    </nav>

                    {/* Mobile/Tablet-only Role Switcher inside Sidebar */}
                    <div className="lg:hidden mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Alternar Perfil (Demo)</p>
                        <div className="grid grid-cols-2 gap-2 px-1">
                            <button
                                onClick={() => setRole('attendant')}
                                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${role === 'attendant' ? 'bg-primary border-primary text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">support_agent</span> Atendente
                            </button>
                            <button
                                onClick={() => setRole('manager')}
                                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${role === 'manager' ? 'bg-primary border-primary text-slate-900' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span> Gerente
                            </button>
                            <button
                                onClick={() => setRole('admin')}
                                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${role === 'admin' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <span className="material-symbols-outlined text-[16px]">shield_person</span> Admin
                            </button>
                            <button
                                onClick={() => navigate('/checkout')}
                                className="px-2 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 transition-all flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-outlined text-[16px]">shopping_cart</span> Checkout
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-9 bg-slate-200 shrink-0 shadow-sm" style={{ backgroundImage: `url("${userAvatar}")` }}></div>
                            <div className="flex flex-col min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userDisplayName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userDisplayRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                            title="Sair"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};