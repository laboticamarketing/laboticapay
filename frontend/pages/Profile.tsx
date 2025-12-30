import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../src/services/auth.service';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authService.getProfile();
      setUser(data);
      setFormData({ name: data.name || '', phone: data.phone || '', email: data.email });
      if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setError('Falha ao carregar perfil. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (e.target.name === 'phone') {
      value = value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > 11) value = value.slice(0, 11); // Limit to 11 digits

      if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
      } else {
        value = value.replace(/^(\d*)/, '($1');
      }
    }

    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file)); // Optimistic update
      try {
        const { avatarUrl } = await authService.uploadAvatar(file);
        setAvatarPreview(avatarUrl);
        // Update user state if needed for consistency, but preview handles UI
      } catch (error) {
        toast.error('Erro ao enviar foto.');
        setAvatarPreview(user?.avatarUrl || null); // Revert
      }
    }
  };

  const handleSave = async () => {
    if (passwords.new && passwords.new !== passwords.confirm) {
      toast.error('As novas senhas não coincidem.');
      return;
    }

    if (passwords.new) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(passwords.new)) {
        toast.error('Senha fraca: Mínimo 8 caracteres, maiúscula, minúscula, número e símbolo.');
        return;
      }
      if (passwords.new.includes('123')) {
        toast.error('A senha não pode conter sequências como "123".');
        return;
      }
    }

    try {
      const updatePayload = {
        name: formData.name,
        phone: formData.phone,
        ...(passwords.new ? { currentPassword: passwords.current, newPassword: passwords.new } : {})
      };
      await authService.updateProfile(updatePayload);
      toast.success('Perfil atualizado com sucesso!');
      setPasswords({ current: '', new: '', confirm: '' }); // Reset passwords
    } catch (error: any) {
      console.error('Update failed', error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleRevokeSessions = () => {
    setShowLogoutConfirm(true);
  };

  const confirmRevokeSessions = async () => {
    setShowLogoutConfirm(false);
    try {
      const response = await authService.revokeSessions();
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      toast.success(response.message || 'Sessões revogadas com sucesso.');
    } catch (error) {
      console.error('Failed to revoke sessions', error);
      toast.error('Erro ao desconectar sessões.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
        <div className="size-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erro ao carregar perfil</h3>
        <p className="text-slate-500 mb-6">{error || 'Não foi possível identificar o usuário.'}</p>
        <button onClick={fetchProfile} className="px-6 py-2 bg-primary text-slate-900 font-bold rounded-lg hover:bg-primary-dark transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto flex flex-col gap-6 pb-40 p-4 md:p-8">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <a href="/" className="text-text-secondary hover:text-primary font-medium transition-colors">Home</a>
        <span className="material-symbols-outlined text-text-secondary text-[16px]">chevron_right</span>
        <span className="text-text-main dark:text-white font-medium">Meu Perfil</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black tracking-tight">Meu Perfil</h1>
        <p className="text-text-secondary text-base font-normal">Gerencie suas informações pessoais, segurança e notificações do sistema.</p>
      </div>

      {/* Profile Header */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative group cursor-pointer">
              <div className="bg-center bg-no-repeat bg-cover rounded-full h-24 w-24 ring-4 ring-white dark:ring-surface-dark shadow-md" style={{ backgroundImage: `url("${avatarPreview || 'https://picsum.photos/200'}")` }}></div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => document.getElementById('avatar-upload')?.click()}>
                <span className="material-symbols-outlined text-white">edit</span>
              </div>
            </div>
            <div className="flex flex-col text-center sm:text-left">
              <h2 className="text-text-main dark:text-white text-xl font-bold">{formData.name || user.name || 'Usuário Sem Nome'}</h2>
              <p className="text-text-secondary font-medium">{user.role === 'ATTENDANT' ? 'Atendente Comercial' : user.role}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">ID: #{user.id.slice(0, 8)}</p>
            </div>
          </div>
          <button onClick={() => document.getElementById('avatar-upload')?.click()} className="bg-slate-100 dark:bg-black/20 text-text-main dark:text-primary hover:bg-slate-200 dark:hover:bg-black/40 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            Alterar Foto
          </button>
          <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* ID Section */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary">badge</span>
              <h2 className="text-text-main dark:text-white text-lg font-bold">Identificação</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">Nome Completo</label>
                <input
                  className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-black/20 text-text-main dark:text-white px-3 py-2.5 text-sm focus:border-primary focus:ring-primary"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">E-mail Corporativo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">mail</span>
                  </span>
                  <input className="w-full rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400 pl-10 px-3 py-2.5 text-sm cursor-not-allowed" disabled defaultValue={user.email} name="email" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">WhatsApp / Telefone</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-[18px]">call</span>
                  </span>
                  <input className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-black/20 text-text-main dark:text-white pl-10 px-3 py-2.5 text-sm focus:border-primary focus:ring-primary" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Sem telefone cadastrado" autoComplete="off" />
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary">lock</span>
              <h2 className="text-text-main dark:text-white text-lg font-bold">Segurança</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">Senha Atual</label>
                <input className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-black/20 text-text-main dark:text-white px-3 py-2.5 text-sm focus:border-primary focus:ring-primary" placeholder="••••••••" type="password" name="current" value={passwords.current} onChange={handlePasswordChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">Nova Senha</label>
                <input className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-black/20 text-text-main dark:text-white px-3 py-2.5 text-sm focus:border-primary focus:ring-primary" type="password" name="new" value={passwords.new} onChange={handlePasswordChange} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-main dark:text-gray-300">Confirmar Nova Senha</label>
                <input className="w-full rounded-lg border-gray-200 dark:border-gray-600 bg-white dark:bg-black/20 text-text-main dark:text-white px-3 py-2.5 text-sm focus:border-primary focus:ring-primary" type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Notifications */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-fit">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <h2 className="text-text-main dark:text-white text-lg font-bold">Notificações</h2>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-text-main dark:text-white">Pagamento Confirmado</span>
                  <span className="text-xs text-text-secondary">Receber e-mail imediato</span>
                </div>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-text-main dark:text-white">Link Vencido</span>
                  <span className="text-xs text-text-secondary">Notificar quando expirar</span>
                </div>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl p-6 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
            <h3 className="text-red-700 dark:text-red-400 font-bold text-sm mb-2">Zona de Perigo</h3>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mb-4">Desconectar de todos os outros dispositivos ativos.</p>
            <button
              onClick={handleRevokeSessions}
              className="text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-white dark:bg-transparent px-3 py-2 rounded hover:bg-red-50 transition-colors w-full"
            >
              Desconectar Outras Sessões
            </button>
          </div>
        </div>
      </div>

      {/* Spacer to ensure content is not hidden behind footer */}
      <div className="h-24"></div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end gap-3 z-10 shadow-lg">
        <button className="px-6 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-black font-bold text-sm shadow-sm transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check</span>
          Salvar Alterações
        </button>
      </div>

      {/* Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowLogoutConfirm(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[24px]">logout</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Desconectar sessões?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Você tem certeza que deseja desconectar todas as outras sessões ativas? Você permanecerá conectado apenas neste dispositivo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRevokeSessions}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};