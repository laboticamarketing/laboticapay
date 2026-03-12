import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface CriarPagamentoParams {
    valor: number;
    referencia: string;
    orderId?: string;
    numeroCartao: string;
    cvv: string;
    mesValidade: string;
    anoValidade: string;
    nomeCartao: string;
    parcelas?: number;
}

export interface CriarPagamentoResult {
    sucesso: boolean;
    tid?: string;
    returnCode?: string;
    returnMessage?: string;
}

export interface CancelarPagamentoParams {
    tid: string;
    valor?: number;
}

export interface CancelarPagamentoResult {
    sucesso: boolean;
    mensagem: string;
}

export function usePayment() {
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [resultado, setResultado] = useState<CriarPagamentoResult | CancelarPagamentoResult | null>(null);

    const processar = useCallback(async (params: CriarPagamentoParams) => {
        setLoading(true);
        setErro(null);
        setResultado(null);

        try {
            const { data } = await api.post<CriarPagamentoResult>('/pagamento/criar', {
                valor: params.valor,
                referencia: params.referencia,
                orderId: params.orderId,
                numeroCartao: params.numeroCartao,
                cvv: params.cvv,
                mesValidade: params.mesValidade,
                anoValidade: params.anoValidade,
                nomeCartao: params.nomeCartao,
                parcelas: params.parcelas ?? 1,
            });

            setResultado(data);
            return data;
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { returnMessage?: string; mensagem?: string } } })
                          .response?.data?.returnMessage ??
                      (err as { response?: { data?: { returnMessage?: string; mensagem?: string } } })
                          .response?.data?.mensagem ??
                      'Erro ao processar pagamento'
                    : 'Erro ao processar pagamento';

            setErro(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelar = useCallback(async (params: CancelarPagamentoParams) => {
        setLoading(true);
        setErro(null);
        setResultado(null);

        try {
            const { data } = await api.post<CancelarPagamentoResult>('/pagamento/cancelar', {
                tid: params.tid,
                valor: params.valor,
            });

            setResultado(data);
            return data;
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && err !== null && 'response' in err
                    ? (err as { response?: { data?: { mensagem?: string } } }).response?.data
                          ?.mensagem ?? 'Erro ao cancelar transação'
                    : 'Erro ao cancelar transação';

            setErro(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { processar, cancelar, loading, erro, resultado };
}
