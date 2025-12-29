import { api } from '../lib/api';
import { CreateCustomerDTO, Customer, CustomerListResponse, CustomerParams } from '../types/customer.types';

export const customerService = {
    async list(params?: CustomerParams) {
        const { data } = await api.get<CustomerListResponse>('/customers', { params });
        return data;
    },

    async create(payload: CreateCustomerDTO) {
        const { data } = await api.post<Customer>('/customers', payload);
        return data;
    },

    async getById(id: string) {
        const { data } = await api.get<Customer>(`/customers/${id}`);
        return data;
    },

    async update(id: string, payload: CreateCustomerDTO) {
        const { data } = await api.put<Customer>(`/customers/${id}`, payload);
        return data;
    }
};
