import { api } from '../lib/api';
import { CreateOrderDTO, Order, OrderListResponse, OrderListParams } from '../types/order.types';

export const orderService = {
    async create(payload: CreateOrderDTO) {
        return api.post<Order>('/orders', payload).then(res => res.data);
    },

    async list(params?: OrderListParams) {
        return api.get<OrderListResponse>('/orders', { params }).then(res => res.data);
    },

    async addNote(orderId: string, content: string) {
        return api.post(`/orders/${orderId}/notes`, { content });
    },

    async getStats() {
        return api.get<{ pending: number; canceled: number; paidToday: number }>('/orders/stats').then(res => res.data);
    }
};
