import { api } from '../lib/api';

export interface DashboardStats {
    salesToday: number;
    pendingOrders: number;
    expiringToday: number;
    monthlyRevenue: number;
    paidCountMonth: number;
    chartData: { name: string; value: number }[];
}

export const dashboardService = {
    async getStats() {
        const response = await api.get<DashboardStats>('/dashboard/stats');
        return response.data;
    }
};
