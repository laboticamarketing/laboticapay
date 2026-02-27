import { api } from '../lib/api';

export interface DashboardStats {
    salesToday: number;
    pendingOrders: number;
    expiringToday: number;
    monthlyRevenue: number;
    paidCountMonth: number;
    chartData: { name: string; value: number }[];
}

export interface DashboardParams {
    startDate?: string;
    endDate?: string;
}

export const dashboardService = {
    async getStats(params?: DashboardParams) {
        const response = await api.get<DashboardStats>('/dashboard/stats', { params });
        return response.data;
    }
};
