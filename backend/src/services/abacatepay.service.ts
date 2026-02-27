import { config } from '../config/env';

// ─── Service Result Type (same public interface) ────────────────────

export interface PaymentResult {
    success: boolean;
    message: string;
    billingId?: string;
    billingUrl?: string;
    pixId?: string;
    qrCode?: string;
    qrCodeBase64?: string;
    status?: string;
    amount?: number;
}

// ─── Input Types ────────────────────────────────────────────────────

export interface CreateCustomerInput {
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
}

export interface CreateBillingInput {
    frequency?: 'ONE_TIME' | 'MULTIPLE_PAYMENTS';
    methods: ('PIX' | 'CARD')[];
    products: { externalId: string; name: string; description?: string; quantity: number; price: number }[];
    returnUrl: string;
    completionUrl: string;
    customerId?: string;
    customer?: CreateCustomerInput;
    allowCoupons?: boolean;
    coupons?: string[];
    externalId?: string;
    metadata?: Record<string, unknown>;
}

export interface CreatePixQrCodeInput {
    amount: number;
    expiresIn?: number;
    description?: string;
    customer?: CreateCustomerInput;
    metadata?: Record<string, unknown>;
}

// ─── REST Client (AbacatePay v1 API routes) ────────────────────────

const API_BASE = 'https://api.abacatepay.com/v1';
const API_KEY = config.abacatepay.apiKey;

async function apiRequest<T = any>(method: string, route: string, body?: any): Promise<T> {
    const url = `${API_BASE}${route}`;

    console.log(`[AbacatePay] ${method} ${route}`, body ? JSON.stringify(body).substring(0, 200) : '');

    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000),
    });

    const text = await res.text();
    let json: any;
    try { json = JSON.parse(text); } catch { json = { error: text }; }

    if (!res.ok) {
        console.error(`[AbacatePay] ERROR ${res.status}:`, json.error || text.substring(0, 500));
        throw new Error(json.error || `AbacatePay HTTP ${res.status}`);
    }

    if (json.error) throw new Error(json.error);
    return json.data;
}

// ─── AbacatePay Service (v1 API via fetch) ──────────────────────────

class AbacatePayService {

    // ─── Customer ───────────────────────────────────────────────────

    async createCustomer(input: CreateCustomerInput) {
        try {
            const result = await apiRequest('POST', '/customer/create', input);
            console.log(`[AbacatePay] Customer created: ${result.id}`);
            return result;
        } catch (error: any) {
            console.error('[AbacatePay] Create customer failed:', error.message);
            return null;
        }
    }

    async listCustomers() {
        try {
            return await apiRequest('GET', '/customer/list');
        } catch (error: any) {
            console.error('[AbacatePay] List customers failed:', error.message);
            return [];
        }
    }

    // ─── Billing (Cobrança) ─────────────────────────────────────────

    async createBilling(input: CreateBillingInput): Promise<PaymentResult> {
        try {
            const result = await apiRequest('POST', '/billing/create', {
                frequency: input.frequency || 'ONE_TIME',
                methods: input.methods,
                products: input.products.map(p => ({
                    externalId: p.externalId,
                    name: p.name,
                    description: p.description || '',
                    quantity: p.quantity,
                    price: p.price,
                })),
                returnUrl: input.returnUrl,
                completionUrl: input.completionUrl,
                customerId: input.customerId,
                customer: input.customer,
                allowCoupons: input.allowCoupons ?? false,
                coupons: input.coupons ?? [],
            });

            return {
                success: true,
                message: 'Cobrança criada com sucesso',
                billingId: result.id,
                billingUrl: result.url,
                status: result.status,
                amount: result.amount,
            };
        } catch (error: any) {
            console.error('[AbacatePay] Create billing failed:', error.message);
            return {
                success: false,
                message: `Falha ao criar cobrança: ${error.message}`,
            };
        }
    }

    async listBillings() {
        try {
            return await apiRequest('GET', '/billing/list');
        } catch (error: any) {
            console.error('[AbacatePay] List billings failed:', error.message);
            return [];
        }
    }

    // ─── PIX QR Code ────────────────────────────────────────────────

    async createPixQrCode(input: CreatePixQrCodeInput): Promise<PaymentResult> {
        try {
            const result = await apiRequest('POST', '/pixQrCode/create', {
                amount: input.amount,
                expiresIn: input.expiresIn ?? 3600,
                description: input.description,
                customer: input.customer,
                metadata: input.metadata,
            });

            return {
                success: true,
                message: 'QR Code PIX gerado com sucesso',
                pixId: result.id,
                qrCode: result.brCode,
                qrCodeBase64: result.brCodeBase64,
                status: result.status,
                amount: result.amount,
            };
        } catch (error: any) {
            console.error('[AbacatePay] Create PIX QR Code failed:', error.message);
            return {
                success: false,
                message: `Falha ao gerar QR Code PIX: ${error.message}`,
            };
        }
    }

    async checkPixStatus(pixId: string) {
        try {
            return await apiRequest('GET', `/pixQrCode/check?id=${pixId}`);
        } catch (error: any) {
            console.error('[AbacatePay] Check PIX status failed:', error.message);
            return null;
        }
    }

    // ─── Simulate Payment (Dev Mode only) ───────────────────────────

    async simulatePixPayment(pixId: string): Promise<boolean> {
        try {
            const result = await apiRequest('POST', `/pixQrCode/simulate-payment?id=${pixId}`, { metadata: {} });
            return result?.status === 'PAID';
        } catch (error: any) {
            console.error('[AbacatePay] Simulate payment failed:', error.message);
            return false;
        }
    }

    // ─── Health Check ───────────────────────────────────────────────

    async healthCheck(): Promise<{ success: boolean; message: string }> {
        try {
            await apiRequest('GET', '/customer/list');
            return { success: true, message: 'AbacatePay: Conexão OK' };
        } catch (error: any) {
            return { success: false, message: `AbacatePay: ${error.message}` };
        }
    }
}

export const abacatePayService = new AbacatePayService();
