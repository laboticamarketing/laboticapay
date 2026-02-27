import { NavLink, Outlet } from 'react-router-dom';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    LayoutDashboard,
    Users,
    ShoppingBag,
    User,
    LogOut,
    Menu,
    PlusCircle,
} from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Pedidos' },
    { to: '/admin/new-link', icon: PlusCircle, label: 'Novo Link' },
    { to: '/admin/customers', icon: Users, label: 'Clientes' },
    { to: '/admin/profile', icon: User, label: 'Meu Perfil' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    const { user, logout } = useAuth();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <img
                    src="/logo.png"
                    alt="La Botica Pay"
                    className="h-10 w-10 rounded-full object-contain"
                />
                <div>
                    <p className="font-semibold text-sm text-foreground">La Botica Pay</p>
                    <p className="text-xs text-muted-foreground">Área do Atendente</p>
                </div>
            </div>

            <Separator />

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary-50 text-primary-700'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`
                        }
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            <Separator />

            {/* User info + Logout */}
            <div className="p-4">
                <div className="flex items-center gap-3">
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name || 'Avatar'}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {(user?.role || '').toString().toUpperCase() || 'ATENDENTE'}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-error-500"
                        onClick={logout}
                        title="Sair"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout() {
    const [sheetOpen, setSheetOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border bg-card">
                <SidebarContent />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 p-4 bg-card border-b border-border">
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <img
                        src="/logo.png"
                        alt="La Botica Pay"
                        className="h-7 w-7 rounded-full object-contain"
                    />
                    <span className="font-semibold text-sm">La Botica Pay</span>
                </div>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent onNavigate={() => setSheetOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 lg:p-8 pt-20 lg:pt-8">
                    <Breadcrumbs />
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
