import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../server';
import { startOfDay, startOfMonth, subDays, format } from 'date-fns';

export const getDashboardStats = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const today = startOfDay(new Date());
        const startOfCurrentMonth = startOfMonth(new Date());
        const last7Days = subDays(new Date(), 7);

        // 1. Transactions Today
        const salesToday = await prisma.order.aggregate({
            _sum: { totalValue: true },
            where: {
                status: 'PAID',
                updatedAt: { gte: today }
            }
        });

        // 2. Pending Orders
        const pendingCount = await prisma.order.count({
            where: { status: 'PENDING' }
        });

        const expiringTodayCount = await prisma.paymentLink.count({
            where: {
                status: 'PENDING',
                // Mock logic for expiration as we don't have due date in DB clearly yet, assuming created today for MVP
                createdAt: { gte: today }
            }
        });

        // 3. Monthly Revenue
        const monthlyRevenue = await prisma.order.aggregate({
            _sum: { totalValue: true },
            where: {
                status: 'PAID',
                updatedAt: { gte: startOfCurrentMonth }
            }
        });

        const paidCount = await prisma.order.count({
            where: { status: 'PAID', updatedAt: { gte: startOfCurrentMonth } }
        });

        // 4. Weekly Performance Chart Data
        // Aggregate manually or use raw query for speed. For MVP, loop last 7 days.
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const day = subDays(new Date(), i);
            const beginning = startOfDay(day);
            const end = new Date(beginning);
            end.setHours(23, 59, 59, 999);

            const dailySum = await prisma.order.aggregate({
                _sum: { totalValue: true },
                where: {
                    status: 'PAID',
                    updatedAt: { gte: beginning, lte: end }
                }
            });

            chartData.push({
                name: format(day, 'dd/MM'), // e.g., 23/10
                value: Number(dailySum._sum.totalValue || 0)
            });
        }

        reply.send({
            salesToday: Number(salesToday._sum.totalValue || 0),
            pendingOrders: pendingCount,
            expiringToday: expiringTodayCount,
            monthlyRevenue: Number(monthlyRevenue._sum.totalValue || 0),
            paidCountMonth: paidCount,
            chartData
        });

    } catch (error) {
        console.error(error);
        reply.status(500).send({ error: 'Failed to fetch dashboard stats' });
    }
};
