/**
 * Serviço PIX via API e.Rede
 * Documentação: https://developer.userede.com.br/e-rede
 * Schema: ObjectRequestBodyPostTransactionsSolicitacaoQrCodePix
 */
import axios, { AxiosError } from 'axios';
import { config } from '../config/env';

const SANDBOX_BASE = 'https://sandbox-erede.useredecloud.com.br';
const PRODUCTION_BASE = 'https://api.userede.com.br/erede';

export interface CriarPixResult {
    success: boolean;
    tid?: string;
    qrCodeBase64?: string;
    qrCodeText?: string;
    returnCode?: string;
    returnMessage?: string;
    expiresAt?: string;
}

export interface ConsultarPixResult {
    tid: string;
    status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
    amount?: number;
    returnCode?: string;
    returnMessage?: string;
}

function getBaseUrl(): string {
    return config.rede.env === 'sandbox' ? SANDBOX_BASE : PRODUCTION_BASE;
}

function getAuthHeader(): string {
    const credentials = Buffer.from(`${config.rede.pv}:${config.rede.token}`).toString('base64');
    return `Basic ${credentials}`;
}

/**
 * Cria QR Code PIX na Rede
 * POST /v1/transactions
 * Payload: { kind: "Pix", reference, amount } - conforme ObjectRequestBodyPostTransactionsSolicitacaoQrCodePix
 */
export async function criarQrCodePix(
    valorCentavos: number,
    referencia: string,
    _orderId?: string
): Promise<CriarPixResult> {
    if (!config.rede.pv || !config.rede.token) {
        return {
            success: false,
            returnMessage: 'Gateway de pagamento não configurado',
        };
    }

    const baseUrl = getBaseUrl();

    // reference: max 16 caracteres (documentação)
    const reference = referencia.replace(/-/g, '').slice(0, 16);

    // Data de expiração do QR Code: 30 min no futuro, formato YYYY-MM-DDThh:mm:ss (19 chars)
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000);
    const dateTimeExpiration = expiraEm.toISOString().slice(0, 19);

    const payload = {
        kind: 'Pix',
        reference,
        amount: valorCentavos,
        qrCode: {
            dateTimeExpiration,
        },
    };

    try {
        const response = await axios.post(`${baseUrl}/v1/transactions`, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: getAuthHeader(),
                'Transaction-Response': 'brand-return-opened',
            },
            timeout: 30000,
        });

        const data = response.data;

        // Resposta PIX pendente: qrCodeResponse (ObjectQrCodeResponse)
        const qrRes = data.qrCodeResponse ?? data.authorization;
        const tid = qrRes?.tid ?? data.tid ?? data.id;
        const returnCode = qrRes?.returnCode ?? data.returnCode ?? '';
        const returnMessage = qrRes?.returnMessage ?? data.returnMessage ?? '';

        const qrCodeBase64 = qrRes?.qrCodeImage;
        const qrCodeText = qrRes?.qrCodeData;

        return {
            success: returnCode === '00',
            tid,
            qrCodeBase64,
            qrCodeText,
            returnCode,
            returnMessage,
            expiresAt: qrRes?.expirationQrCode,
        };
    } catch (err) {
        const axiosErr = err as AxiosError<{ returnMessage?: string; returnCode?: string }>;
        const responseData = axiosErr.response?.data;
        const returnMessage =
            responseData?.returnMessage ??
            (typeof responseData === 'object' && responseData && 'message' in responseData
                ? String((responseData as { message?: string }).message)
                : axiosErr.message ?? 'Falha ao criar QR Code PIX');

        return {
            success: false,
            returnCode: responseData?.returnCode ?? '-1',
            returnMessage,
        };
    }
}

/**
 * Consulta status de transação PIX na Rede
 * GET /v1/transactions/{tid}
 */
export async function consultarPix(tid: string): Promise<ConsultarPixResult | null> {
    if (!config.rede.pv || !config.rede.token) {
        return null;
    }

    const baseUrl = getBaseUrl();

    try {
        const response = await axios.get(`${baseUrl}/v1/transactions/${tid}`, {
            headers: {
                Authorization: getAuthHeader(),
            },
            timeout: 15000,
        });

        const data = response.data;
        const auth = data.authorization ?? data.qrCodeResponse;
        const status = auth?.status ?? data.status ?? 'PENDING';
        // Para PIX: returnCode "00" na criação significa "QR gerado com sucesso", não "pagamento recebido"
        // Só considerar PAID quando status for explicitamente Approved/PAID/CAPTURED
        const paid = status === 'CAPTURED' || status === 'PAID' || status === 'Approved';

        return {
            tid: data.tid ?? tid,
            status: paid ? 'PAID' : (status === 'Pending' || status === 'AUTHORIZED' ? 'PENDING' : 'EXPIRED'),
            amount: data.amount ?? auth?.amount,
            returnCode: auth?.returnCode ?? data.returnCode,
            returnMessage: auth?.returnMessage ?? data.returnMessage,
        };
    } catch {
        return null;
    }
}
