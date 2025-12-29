export interface Address {
    id?: string;
    type: string;
    zip: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
    isPrimary?: boolean;
}

export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    cpf: string | null;
    birthDate: string | null;
    addresses?: Address[];
    notes?: string | null;
    asaasId: string | null;
    createdAt: string;
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
}
