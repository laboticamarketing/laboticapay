import { FastifyInstance } from 'fastify';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../lib/middleware/auth.middleware';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', requireAuth);

    fastify.get('/stats', dashboardController.getDashboardStats);
}
