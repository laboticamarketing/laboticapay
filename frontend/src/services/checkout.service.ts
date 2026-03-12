import axios from 'axios';
import { unmask, toInternationalPhone } from '../lib/validation';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3333' : 'https://api.laboticamanipulacao.com');

/** Public checkout API — no auth required */
const checkoutApi = axios.create({
    baseURL: `${API_URL}/checkout`,
    headers: { 'Content-Type': 'application/json' },
});

export interface CheckoutOrder {
    id: string;
    totalValue: number;
    shippingValue: number;
    discountValue: number;
    discountType: string | null;
    status: string;
    customer: {
        id: string;
        name: string;
        email: string | null;
        phone: string;
        cpf: string | null;
        rg: string | null;
        birthDate: string | null;
        addresses: {
            id: string;
            zip: string;
            street: string;
            number: string;
            neighborhood: string;
            city: string;
            state: string;
            complement?: string;
            isPrimary?: boolean;
        }[];
    };
    items: {
        id: string;
        name: string;
        dosage?: string;
        price?: number;
    }[];
    paymentLink?: {
        asaasUrl: string;
        status: string;
    };
    shippingType?: 'FIXED' | 'FREE' | 'DYNAMIC';
}

export interface ShippingQuote {
    id: number;
    name: string;
    price: number;
    deliveryTime: number;
    company: {
        id: number;
        name: string;
        picture: string;
    };
}

export interface SaveProgressData {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    rg?: string;
    birthDate?: string;
    address?: {
        zip: string;
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        complement?: string;
    };
    notes?: string;
    deliveryMethod?: 'SHIP' | 'PICKUP';
    pickupLocation?: string;
    shippingValue?: number;
}

export interface PaymentData {
    amount: number;
    paymentMethod: 'PIX' | 'CARD' | 'BILLING';
    customerData?: {
        name: string;
        email: string;
        cpf: string;
        phone: string;
    };
}

export interface PaymentResult {
    success: boolean;
    message: string;
    billingId?: string;
    billingUrl?: string;
    pixId?: string;
    tid?: string;
    qrCode?: string;
    qrCodeText?: string;
    qrCodeBase64?: string;
    status?: string;
    amount?: number;
}

export const checkoutService = {
    async getOrder(orderId: string): Promise<CheckoutOrder> {
        const { data } = await checkoutApi.get(`/${orderId}`);
        return data;
    },

    async saveProgress(orderId: string, payload: SaveProgressData) {
        const cleanPayload = {
            ...payload,
            cpf: unmask(payload.cpf) || undefined,
            rg: unmask(payload.rg) || undefined,
            phone: toInternationalPhone(payload.phone) || undefined,
            address: payload.address
                ? {
                    ...payload.address,
                    zip: unmask(payload.address.zip),
                    number: payload.address.number === 'SN' || !payload.address.number
                        ? payload.address.number
                        : unmask(payload.address.number)
                }
                : undefined
        };
        const { data } = await checkoutApi.post(`/${orderId}`, cleanPayload);
        return data;
    },

    async processPayment(orderId: string, payload: PaymentData): Promise<PaymentResult> {
        const cleanPayload = {
            ...payload,
            customerData: payload.customerData
                ? {
                    ...payload.customerData,
                    cpf: unmask(payload.customerData.cpf),
                    phone: toInternationalPhone(payload.customerData.phone)
                }
                : undefined
        };
        const { data } = await checkoutApi.post<PaymentResult>(`/${orderId}/pay`, cleanPayload);
        return data;
    },

    async deleteAddress(orderId: string, addressId: string) {
        await checkoutApi.delete(`/${orderId}/address/${addressId}`);
    },

    async lookupByCpf(cpf: string) {
        const { data } = await checkoutApi.get('/lookup-cpf', { params: { cpf: unmask(cpf) } });
        return data as {
            found: boolean;
            customer?: {
                id: string;
                name: string;
                email: string | null;
                phone: string;
                cpf: string | null;
                rg: string | null;
                birthDate: string | null;
                addresses: CheckoutOrder['customer']['addresses'];
            }
        };
    },

    async getShippingQuotes(zipCode: string): Promise<ShippingQuote[]> {
        const { data } = await checkoutApi.get('/shipping-quote', { params: { zip: zipCode } });
        return data;
    }
};
