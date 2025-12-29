import React, { useState } from 'react';

export const AdminSettings: React.FC = () => {
  // Mock states for interactivity
  const [notifications, setNotifications] = useState({
    emailNewOrder: true,
    emailPayment: true,
    emailFailure: false,
    smsLink: true,
    smsReminder: false
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    passwordRotation: false,
    sessionTimeout: '30'
  });

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Home</span>
                <span>/</span>
                <span className="text-white">Configurações do Sistema</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Configurações Globais</h1>
                    <p className="text-slate-400 mt-1 max-w-2xl">Gerencie gateways de pagamento, integrações, notificações e políticas de segurança da plataforma.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    Salvar Alterações
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column (Main Content) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Gateways Card */}
                <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Gateways de Pagamento</h3>
                                <p className="text-sm text-slate-400">Configure os provedores de pagamento aceitos.</p>
                            </div>
                        </div>
                        <button className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors">
                            Adicionar Novo
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Pagar.me */}
                        <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded bg-blue-600 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">credit_card</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Cartão de Crédito (Pagar.me)</h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">API Key: pk_live_...8a2b</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase border border-green-500/20">Ativo</span>
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">settings</span>
                                </button>
                            </div>
                        </div>

                        {/* Pix */}
                        <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded bg-teal-500/10 flex items-center justify-center text-teal-500">
                                    <span className="material-symbols-outlined">qr_code_2</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Pix (Banco Central)</h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">Chave: 12.345.678/0001-90</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 uppercase border border-green-500/20">Ativo</span>
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">settings</span>
                                </button>
                            </div>
                        </div>

                        {/* Boleto */}
                        <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group opacity-60 hover:opacity-100">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Boleto Bancário</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Não configurado</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-400 uppercase border border-slate-600">Inativo</span>
                                <button className="text-slate-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">settings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Card */}
                <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <span className="material-symbols-outlined">extension</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Integrações de Sistema</h3>
                            <p className="text-sm text-slate-400">Conecte com ERPs e ferramentas externas.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Token de Acesso ERP</label>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    value="************************" 
                                    readOnly
                                    className="w-full bg-slate-800 border-slate-700 text-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-mono focus:ring-blue-500 focus:border-blue-500" 
                                />
                                <span className="absolute right-3 top-2.5 text-slate-500 cursor-pointer hover:text-white">
                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-green-500 text-xs font-medium">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Conectado com sucesso
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">WhatsApp Business API Key</label>
                            <input 
                                type="text" 
                                placeholder="Insira a chave da API..." 
                                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 placeholder-slate-500" 
                            />
                            <p className="text-xs text-slate-500 mt-2">Necessário para envio automático de links.</p>
                        </div>
                    </div>
                </div>

                {/* Policies Card */}
                <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-300">
                            <span className="material-symbols-outlined">gavel</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Políticas e Termos</h3>
                            <p className="text-sm text-slate-400">Documentos legais exibidos no checkout.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40 rounded-xl p-6 transition-all group">
                            <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-white">description</span>
                            <div className="text-center">
                                <span className="block text-sm font-bold text-slate-300 group-hover:text-white">Termos de Uso.pdf</span>
                                <span className="block text-xs text-slate-500">Clique para substituir</span>
                            </div>
                        </button>
                         <button className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-slate-500 bg-slate-800/20 hover:bg-slate-800/40 rounded-xl p-6 transition-all group">
                            <span className="material-symbols-outlined text-3xl text-slate-500 group-hover:text-white">policy</span>
                            <div className="text-center">
                                <span className="block text-sm font-bold text-slate-300 group-hover:text-white">Política de Privacidade.pdf</span>
                                <span className="block text-xs text-slate-500">Clique para substituir</span>
                            </div>
                        </button>
                    </div>
                </div>

            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-6">
                
                {/* Notifications */}
                <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined">notifications</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Notificações</h3>
                            <p className="text-sm text-slate-400">Configure alertas automáticos.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Alertas por E-mail</h4>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${notifications.emailNewOrder ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-600 group-hover:border-slate-500'}`}>
                                        {notifications.emailNewOrder && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.emailNewOrder} 
                                        onChange={() => setNotifications({...notifications, emailNewOrder: !notifications.emailNewOrder})}
                                        className="hidden" 
                                    />
                                    <span className="text-sm text-slate-300">Novo pedido gerado</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${notifications.emailPayment ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-600 group-hover:border-slate-500'}`}>
                                        {notifications.emailPayment && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.emailPayment}
                                        onChange={() => setNotifications({...notifications, emailPayment: !notifications.emailPayment})}
                                        className="hidden" 
                                    />
                                    <span className="text-sm text-slate-300">Pagamento confirmado</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${notifications.emailFailure ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-600 group-hover:border-slate-500'}`}>
                                        {notifications.emailFailure && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.emailFailure}
                                        onChange={() => setNotifications({...notifications, emailFailure: !notifications.emailFailure})}
                                        className="hidden" 
                                    />
                                    <span className="text-sm text-slate-300">Falha na integração</span>
                                </label>
                            </div>
                        </div>

                        <div className="h-px bg-slate-800"></div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Alertas SMS</h4>
                             <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${notifications.smsLink ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-600 group-hover:border-slate-500'}`}>
                                        {notifications.smsLink && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.smsLink}
                                        onChange={() => setNotifications({...notifications, smsLink: !notifications.smsLink})}
                                        className="hidden" 
                                    />
                                    <span className="text-sm text-slate-300">Link enviado ao cliente</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${notifications.smsReminder ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-slate-600 group-hover:border-slate-500'}`}>
                                        {notifications.smsReminder && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={notifications.smsReminder}
                                        onChange={() => setNotifications({...notifications, smsReminder: !notifications.smsReminder})}
                                        className="hidden" 
                                    />
                                    <span className="text-sm text-slate-300">Lembrete de vencimento</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-slate-900 dark:bg-surface-dark border border-slate-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                            <span className="material-symbols-outlined">security</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Segurança</h3>
                            <p className="text-sm text-slate-400">Controles de acesso e proteção.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Autenticação 2FA</p>
                                <p className="text-xs text-slate-500">Obrigatório para Admins</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={security.twoFactor} 
                                    onChange={() => setSecurity({...security, twoFactor: !security.twoFactor})} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-300"></div>
                            </label>
                        </div>

                         <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Troca de Senha</p>
                                <p className="text-xs text-slate-500">Forçar a cada 90 dias</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={security.passwordRotation} 
                                    onChange={() => setSecurity({...security, passwordRotation: !security.passwordRotation})} 
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-300"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Expiração da Sessão</label>
                            <select 
                                value={security.sessionTimeout}
                                onChange={(e) => setSecurity({...security, sessionTimeout: e.target.value})}
                                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
                            >
                                <option value="15">15 minutos</option>
                                <option value="30">30 minutos</option>
                                <option value="60">1 hora</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Help Box */}
                <div className="bg-slate-900 border border-blue-900/30 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 size-20 rounded-full bg-blue-500/10 blur-xl"></div>
                    <h3 className="text-blue-400 font-bold text-sm mb-2">Precisa de Ajuda?</h3>
                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">Consulte a documentação técnica para configurar corretamente as chaves de API.</p>
                    <button className="text-blue-500 text-sm font-bold flex items-center gap-1 hover:text-blue-400">
                        Ver Documentação 
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};