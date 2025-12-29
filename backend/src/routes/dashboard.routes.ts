import { FastifyInstance } from 'fastify';
import * as dashboardController from '../controllers/dashboard.controller';

export async function dashboardRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.get('/stats', dashboardController.getDashboardStats);
}
