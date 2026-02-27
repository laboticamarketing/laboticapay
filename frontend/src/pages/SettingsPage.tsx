import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import {
    User, Shield, Camera, Eye, EyeOff, Lock,
    Home, ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const fileRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    // Password
    const [currentPw, setCurrentPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setAvatarPreview(user.avatarUrl || '');
        }
    }, [user]);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB.'); return; }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };


    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (avatarFile) {
                await authService.uploadAvatar(avatarFile);
                setAvatarFile(null);
            }
            await authService.updateProfile({ name });
            toast.success('Perfil atualizado!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao salvar.');
        } finally { setSaving(false); }
    };

    const handlePasswordChange = async () => {
        if (newPw.length < 6) { toast.error('A nova senha deve ter pelo menos 6 caracteres.'); return; }
        if (newPw !== confirmPw) { toast.error('As senhas não conferem.'); return; }
        try {
            await authService.updateProfile({ newPassword: newPw, currentPassword: currentPw });
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
            toast.success('Senha alterada com sucesso!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao alterar senha.');
        }
    };

    const initials = name ? name.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2) : 'U';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Home className="w-3.5 h-3.5" />
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">Meu Perfil</span>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
                <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais e segurança.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt={name} className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold">
                                        {initials}
                                    </div>
                                )}
                                <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{name || 'Usuário'}</h2>
                                <p className="text-muted-foreground text-sm">{user?.role || 'Administrador'}</p>
                                <p className="text-muted-foreground text-xs mt-0.5">ID: #{user?.id?.slice(0, 8)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Identification + Aside */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="w-4 h-4 text-primary-500" /> Identificação
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Nome Completo</Label>
                            <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div>
                            <Label>E-mail Corporativo</Label>
                            <Input className="mt-1.5" value={user?.email || ''} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary-500" /> Segurança
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Senha Atual</Label>
                                <div className="relative mt-1.5">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input type={showPw ? 'text' : 'password'} className="pl-9 pr-9" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label>Nova Senha</Label>
                                <div className="relative mt-1.5">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input type={showNewPw ? 'text' : 'password'} className="pl-9 pr-9" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 6 caracteres" />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {newPw && newPw.length < 6 && <p className="text-xs text-error-500 mt-1">Mínimo 6 caracteres</p>}
                            </div>
                            <div>
                                <Label>Confirmar Senha</Label>
                                <div className="relative mt-1.5">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input type={showConfirmPw ? 'text' : 'password'} className="pl-9 pr-9" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPw && confirmPw !== newPw && <p className="text-xs text-error-500 mt-1">Não confere</p>}
                            </div>
                        </div>
                        {currentPw && newPw && (
                            <Button type="button" variant="outline" onClick={handlePasswordChange} disabled={newPw.length < 6 || newPw !== confirmPw}>
                                Alterar Senha
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline">Cancelar</Button>
                    <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white" disabled={saving}>
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            </form>

        </div>
    );
}
