import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { startOfDay, startOfMonth, subDays, format, parseISO } from 'date-fns';

export const getDashboardStats = async (request: FastifyRequest<{ Querystring: { startDate?: string; endDate?: string } }>, reply: FastifyReply) => {
    try {
        const { startDate: startParam, endDate: endParam } = request.query;

        // --- Date range resolution ---
        const now = new Date();
        let rangeStart: Date;
        let rangeEnd: Date = now;
        let chartDays = 7;

        if (startParam && endParam) {
            rangeStart = startOfDay(parseISO(startParam));
            rangeEnd = parseISO(endParam);
            rangeEnd.setHours(23, 59, 59, 999);
            const diffMs = rangeEnd.getTime() - rangeStart.getTime();
            chartDays = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
            if (chartDays > 90) chartDays = 90; // cap
        } else {
            rangeStart = startOfMonth(now);
        }

        const today = startOfDay(now);

        // 1. Sales today
        const salesToday = await prisma.order.aggregate({
            _sum: { totalValue: true },
            where: {
                status: 'PAID',
                updatedAt: { gte: today }
            }
        });

        // 2. Pending orders
        const pendingCount = await prisma.order.count({
            where: { status: 'PENDING' }
        });

        const expiringTodayCount = await prisma.paymentLink.count({
            where: {
                status: 'PENDING',
                createdAt: { gte: today }
            }
        });

        // 3. Revenue in range
        const monthlyRevenue = await prisma.order.aggregate({
            _sum: { totalValue: true },
            where: {
                status: 'PAID',
                updatedAt: { gte: rangeStart, lte: rangeEnd }
            }
        });

        const paidCount = await prisma.order.count({
            where: { status: 'PAID', updatedAt: { gte: rangeStart, lte: rangeEnd } }
        });

        // 4. Chart data
        const chartStart = startOfDay(subDays(now, chartDays - 1));
        const chartEnd = new Date(chartStart);
        chartEnd.setDate(chartStart.getDate() + chartDays);

        const ordersInRange = await prisma.order.findMany({
            where: {
                status: 'PAID',
                updatedAt: {
                    gte: chartStart,
                    lt: chartEnd
                }
            },
            select: {
                updatedAt: true,
                totalValue: true
            }
        });

        const dailyTotals: Record<string, number> = {};
        for (const order of ordersInRange) {
            const dayKey = format(order.updatedAt, 'yyyy-MM-dd');
            const value = Number(order.totalValue || 0);
            dailyTotals[dayKey] = (dailyTotals[dayKey] || 0) + value;
        }

        const chartData = [];
        for (let i = chartDays - 1; i >= 0; i--) {
            const day = subDays(now, i);
            const dayKey = format(day, 'yyyy-MM-dd');
            chartData.push({
                name: format(day, 'dd/MM'),
                value: dailyTotals[dayKey] || 0
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
