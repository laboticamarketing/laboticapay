import type {
    Address as BackendAddress,
    Customer as BackendCustomer,
    CustomerNote as BackendCustomerNote,
} from '../../backend/src/types/contracts';
import type { Order } from './order.types';

export type Address = BackendAddress;
export type CustomerNote = BackendCustomerNote;

export interface Customer extends BackendCustomer {
    orders?: Order[];
}

export interface CustomerListResponse {
    data: Customer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface CreateCustomerDTO {
    name: string;
    email?: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
    addresses?: Address[];
    notes?: string;
}

export interface UpdateCustomerDTO extends CreateCustomerDTO { }

export interface CustomerParams {
    page?: number;
    limit?: number;
    search?: string;
    scope?: 'me' | 'all';
}
