import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../src/services/auth.service';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Slight delay to ensure storage is set before navigation
      setTimeout(() => {
        navigate('/');
      }, 100);
    } catch (err: any) {
      console.error('Login failed', err);
      setError('Falha ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 -z-10 h-full w-full pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      <header className="flex items-center justify-between border-b border-solid border-b-[#f0f4f1] dark:border-b-white/10 px-6 lg:px-10 py-3 bg-white dark:bg-background-dark">
        <div className="flex items-center gap-4 text-text-main dark:text-white">
          <img src="/logo.png" alt="La Botica Pay" className="size-10 object-contain rounded-lg" />
          <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">La Botica Pay</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white border border-border-color text-text-main dark:bg-transparent dark:border-white/20 dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            Fale com o suporte
          </button>
        </div>
      </header>

      <div className="flex h-full grow flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-surface-dark p-8 rounded-xl shadow-lg border border-[#f0f4f1] dark:border-white/5">
          <div className="flex flex-col items-center text-center">
            <div className="size-20 rounded-full bg-white flex items-center justify-center mb-4 text-primary shadow-sm border border-slate-100 dark:border-slate-800">
              <img src="/logo.png" alt="Logo" className="size-full object-contain p-2" />
            </div>
            <h1 className="text-text-main dark:text-white text-[28px] font-bold leading-tight px-4 pb-2">Login do Time Comercial</h1>
            <p className="text-text-secondary dark:text-gray-300 text-sm font-normal leading-normal px-4">
              Acesse para gerar links de pagamento para seus clientes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-5">
              <div className="flex w-full flex-col gap-2">
                <label className="text-text-main dark:text-white text-sm font-medium">E-mail</label>
                <div className="flex w-full items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <input
                    className="flex w-full rounded-l-lg border border-r-0 border-border-color dark:border-white/10 bg-white dark:bg-black/20 focus:ring-0 focus:border-primary h-12 px-4 text-base"
                    placeholder="ex: voce@farmapay.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="text-text-secondary dark:text-gray-400 flex border border-border-color dark:border-white/10 bg-gray-50 dark:bg-gray-800 items-center justify-center px-4 rounded-r-lg border-l-0">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2">
                <label className="text-text-main dark:text-white text-sm font-medium">Senha</label>
                <div className="flex w-full items-stretch rounded-lg group focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <input
                    className="flex w-full rounded-l-lg border border-r-0 border-border-color dark:border-white/10 bg-white dark:bg-black/20 focus:ring-0 focus:border-primary h-12 px-4 text-base"
                    placeholder="Insira sua senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-secondary dark:text-gray-400 flex border border-border-color dark:border-white/10 bg-gray-50 dark:bg-gray-800 items-center justify-center px-4 rounded-r-lg border-l-0 cursor-pointer hover:text-text-main dark:hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input className="h-4 w-4 rounded border-border-color text-primary focus:ring-primary" id="remember-me" name="remember-me" type="checkbox" />
                <label className="ml-2 block text-sm text-text-main dark:text-gray-300" htmlFor="remember-me">Lembrar-me</label>
              </div>
              <div className="text-sm">
                <a className="font-medium text-text-main dark:text-white hover:text-primary transition-colors" href="#">Esqueceu a senha?</a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-text-main hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-symbols-outlined text-black/40 group-hover:text-black/60">lock_open</span>
                </span>
                {loading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
          <div className="text-center pt-2">
            <p className="text-xs text-text-secondary dark:text-gray-500">
              Precisa de acesso? <a className="font-medium text-text-main dark:text-gray-300 hover:text-primary underline transition-colors" href="#">Solicite ao administrador</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};