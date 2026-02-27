import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
    'admin': 'Dashboard',
    'orders': 'Pedidos',
    'new-link': 'Novo Link',
    'customers': 'Clientes',
    'profile': 'Meu Perfil',
};

export default function Breadcrumbs() {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    // Don't render on dashboard root
    if (segments.length <= 1) return null;

    const crumbs = segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const isLast = i === segments.length - 1;

        // Check if it's a UUID (customer detail, etc.)
        const isUuid = /^[0-9a-f-]{8,}$/i.test(seg);
        const label = isUuid ? 'Detalhes' : (ROUTE_LABELS[seg] || seg);

        return { path, label, isLast };
    });

    return (
        <nav className="flex items-center gap-1.5 text-sm mb-6">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-3.5 h-3.5" />
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-neutral-300" />
                    {crumb.isLast ? (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                    ) : (
                        <Link to={crumb.path} className="text-muted-foreground hover:text-foreground transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}
