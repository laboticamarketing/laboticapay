import { Customer } from './customer.types';

export type ShippingType = 'DYNAMIC' | 'FIXED' | 'FREE';
export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'EXPIRED';

export interface OrderItem {
    id: string;
    name: string;
    dosage?: string;
    actives?: string; // Stored as JSON string in DB, usually parsed in frontend if needed
}

export interface Order {
    id: string;
    totalValue: number;
    shippingValue?: number;
    shippingType: ShippingType;
    status: OrderStatus;

    customerId: string;
    customer?: Customer;

    items: OrderItem[];

    paymentLink?: {
        id: string;
        asaasUrl: string;
        status: string;
    };

    createdAt: string;
    updatedAt: string;
}

export interface CreateOrderDTO {
    customerId?: string; // If selecting existing
    newCustomer?: {      // If creating new inline
        name: string;
        phone: string;
        email?: string;
        cpf?: string;
    };
    totalValue: number;
    shippingValue?: number;
    shippingType: ShippingType;
    discountValue?: number;
    discountType?: 'FIXED' | 'PERCENTAGE';
    items: Array<{
        name: string;
        dosage?: string;
        actives?: string[];
    }>;
    internalNotes?: string;
}

export interface OrderListParams {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}

export interface OrderListResponse {
    data: Order[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
