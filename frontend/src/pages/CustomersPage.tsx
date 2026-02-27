import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { customerService } from '@/services/customer.service';
import { Customer } from '@/types/customer.types';
import { Search, Plus, ChevronLeft, ChevronRight, Users, UserCheck, ArrowRight } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function CustomersPage() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [scope, setScope] = useState<'all' | 'me'>('all');

    const fetchCustomers = () => {
        setLoading(true);
        customerService.list({ page, limit: 20, search: search || undefined, scope })
            .then((res) => {
                setCustomers(res.data);
                setTotalPages(res.meta.totalPages);
                setTotal(res.meta.total);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchCustomers(); }, [page, search, scope]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
                    <p className="text-muted-foreground text-sm">Gerencie sua base de clientes e visualize históricos.</p>
                </div>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                    <Plus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative flex-1 w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, email ou CPF..."
                                className="pl-9"
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            <Button
                                variant={scope === 'all' ? 'default' : 'outline'} size="sm"
                                className={scope === 'all' ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''}
                                onClick={() => { setScope('all'); setPage(1); }}
                            >
                                <Users className="w-3.5 h-3.5 mr-1.5" /> Todos
                            </Button>
                            <Button
                                variant={scope === 'me' ? 'default' : 'outline'} size="sm"
                                className={scope === 'me' ? 'bg-primary-500 hover:bg-primary-600 text-white' : ''}
                                onClick={() => { setScope('me'); setPage(1); }}
                            >
                                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Meus Clientes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border">
                                    {['NOME / EMAIL', 'CPF / TELEFONE', 'CRIADO POR', 'AÇÕES'].map(h => (
                                        <th key={h} className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-6 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}><td colSpan={4} className="px-6 py-4"><div className="h-10 bg-muted animate-pulse rounded" /></td></tr>
                                    ))
                                ) : customers.length === 0 ? (
                                    <tr><td colSpan={4}>
                                        <EmptyState icon={Users} title="Nenhum cliente encontrado" description={search ? 'Tente buscar por outro nome ou CPF.' : 'Adicione seu primeiro cliente para começar.'} />
                                    </td></tr>
                                ) : customers.map((c: Customer) => (
                                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-foreground truncate">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{c.email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <p className="text-sm text-foreground">{c.cpf || '-'}</p>
                                            <p className="text-xs text-muted-foreground">{c.phone || '-'}</p>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            {c.createdBy ? (
                                                <Badge variant="secondary" className="text-xs">
                                                    <UserCheck className="w-3 h-3 mr-1" />{c.createdBy.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <button
                                                onClick={() => navigate(`/admin/customers/${c.id}`)}
                                                className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1 transition-colors"
                                            >
                                                Ver Perfil <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                            Total de <strong className="text-foreground">{total}</strong> resultados
                        </span>
                        <div className="flex gap-1.5">
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p: number) => p - 1)}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const pg = i + 1;
                                return (
                                    <Button key={pg} variant={page === pg ? 'default' : 'outline'} size="icon" className={`h-8 w-8 ${page === pg ? 'bg-primary-500 text-white' : ''}`} onClick={() => setPage(pg)}>
                                        {pg}
                                    </Button>
                                );
                            })}
                            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p: number) => p + 1)}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
