/**
 * Configuração e instância do SDK e.Rede (Rede)
 * Usado exclusivamente no servidor - nunca expor token/PV no client
 */
import { config } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Store = require('erede-node/lib/store');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Environment = require('erede-node/lib/environment');

let _store: InstanceType<typeof Store> | null = null;

/**
 * Retorna a Store configurada com as variáveis de ambiente.
 * Lança erro se REDE_PV ou REDE_TOKEN não estiverem configurados.
 */
export function getRedeStore(): InstanceType<typeof Store> {
    if (!config.rede.pv || !config.rede.token) {
        throw new Error('Rede não configurado: REDE_PV e REDE_TOKEN são obrigatórios');
    }

    if (!_store) {
        const environment =
            config.rede.env === 'sandbox' ? Environment.sandbox() : Environment.production();
        _store = new Store(config.rede.token, config.rede.pv, environment);
    }

    return _store;
}

/**
 * Retorna instância do eRede para operações (create, cancel, getByTid).
 */
export function getRedeClient() {
    const store = getRedeStore();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const eRede = require('erede-node/lib/erede');
    return new eRede(store);
}

export { Store, Environment };
