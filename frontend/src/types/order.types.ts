import type {
    Order as BackendOrder,
    OrderItem as BackendOrderItem,
    OrderNote as BackendOrderNote,
    OrderStatus as BackendOrderStatus,
    ShippingType as BackendShippingType,
    PaymentTransaction as BackendOrderTransaction,
    Address as BackendOrderAddress,
} from '../../backend/src/types/contracts';
import type { Customer } from './customer.types';

export type ShippingType = BackendShippingType;
export type OrderStatus = BackendOrderStatus;

export type OrderItem = BackendOrderItem;
export type OrderAddress = BackendOrderAddress;
export type OrderNote = BackendOrderNote;
export type OrderTransaction = BackendOrderTransaction;

export interface Order extends Omit<BackendOrder, 'customer' | 'items' | 'address' | 'notes' | 'transactions'> {
    customer?: Customer;
    items: OrderItem[];
    address?: OrderAddress;
    notes?: OrderNote[];
    transactions?: OrderTransaction[];
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
        price?: number;
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
