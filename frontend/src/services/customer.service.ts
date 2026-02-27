import { api } from '../lib/api';
import { CreateCustomerDTO, Customer, CustomerListResponse, CustomerNote, CustomerParams, UpdateCustomerDTO } from '../types/customer.types';
import { unmask } from '../lib/validation';

export const customerService = {
    async list(params?: CustomerParams) {
        const { data } = await api.get<CustomerListResponse>('/customers', { params });
        return data;
    },

    async create(payload: CreateCustomerDTO) {
        const cleanPayload = {
            ...payload,
            cpf: unmask(payload.cpf) || undefined,
            phone: unmask(payload.phone),
            addresses: payload.addresses?.map(a => ({ ...a, zip: unmask(a.zip) }))
        };
        const { data } = await api.post<Customer>('/customers', cleanPayload);
        return data;
    },

    async getById(id: string) {
        const { data } = await api.get<Customer>(`/customers/${id}`);
        return data;
    },

    async update(id: string, payload: UpdateCustomerDTO) {
        const cleanPayload = {
            ...payload,
            cpf: unmask(payload.cpf) || undefined,
            phone: unmask(payload.phone),
            addresses: payload.addresses?.map(a => ({ ...a, zip: unmask(a.zip) }))
        };
        const { data } = await api.put<Customer>(`/customers/${id}`, cleanPayload);
        return data;
    },

    async addNote(id: string, content: string) {
        const { data } = await api.post<CustomerNote>(`/customers/${id}/notes`, { content });
        return data;
    },
};
