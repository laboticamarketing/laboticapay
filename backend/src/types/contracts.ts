export type Role = 'ATTENDANT' | 'MANAGER' | 'ADMIN' | 'PHARMACIST';

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'EXPIRED';

export type ShippingType = 'DYNAMIC' | 'FIXED' | 'FREE';

export interface Address {
    id: string;
    customerId: string;
    type: string;
    zip: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string | null;
    isPrimary?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CustomerNote {
    id: string;
    customerId: string;
    content: string;
    authorId?: string | null;
    createdAt: string;
}

export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    cpf: string | null;
    rg?: string | null;
    birthDate: string | null;
    notes?: string | null;
    asaasId?: string | null;
    organizationId?: string | null;
    createdAt: string;
    updatedAt: string;
    createdById?: string | null;
    createdBy?: {
        id: string;
        name: string | null;
    } | null;
    addresses?: Address[];
    customerNotes?: CustomerNote[];
}

export interface OrderItem {
    id: string;
    orderId: string;
    name: string;
    dosage?: string | null;
    actives?: unknown;
    price?: number | null;
    createdAt: string;
}

export type NoteAuthor = 'ATTENDANT' | 'CUSTOMER';

export interface OrderNote {
    id: string;
    orderId: string;
    content: string;
    authorType: NoteAuthor;
    authorId?: string | null;
    author?: {
        id: string;
        name: string | null;
    } | null;
    createdAt: string;
}

export interface PaymentLink {
    id: string;
    orderId: string;
    asaasPaymentId?: string | null;
    asaasUrl?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    gatewayId: string;
    type: string;
    status: string;
    amount: number;
    metadata?: unknown;
    createdAt: string;
}

export interface Order {
    id: string;
    totalValue: number;
    shippingValue?: number | null;
    originalShippingValue?: number | null;
    shippingType: ShippingType;
    discountValue?: number | null;
    discountType?: 'FIXED' | 'PERCENTAGE' | null;
    status: OrderStatus;
    attachmentUrl?: string | null;
    organizationId?: string | null;
    userId: string;
    customerId: string;
    addressId?: string | null;
    createdAt: string;
    updatedAt: string;
    customer?: Customer;
    address?: Address | null;
    items: OrderItem[];
    notes?: OrderNote[];
    paymentLink?: PaymentLink | null;
    transactions?: PaymentTransaction[];
}

