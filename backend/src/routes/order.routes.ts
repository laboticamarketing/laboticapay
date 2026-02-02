import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as orderController from '../controllers/order.controller';
import { requireAuth } from '../lib/middleware/auth.middleware';

export async function orderRoutes(fastify: FastifyInstance) {
    // Protected routes - ensure JWT verification
    fastify.addHook('onRequest', requireAuth);

    fastify.post('/', orderController.createOrder);
    fastify.get('/stats', orderController.getOrderStats);

    // List Orders with Search Schema
    fastify.get('/', {
        schema: {
            querystring: z.object({
                page: z.coerce.number().optional(),
                limit: z.coerce.number().optional(),
                status: z.enum(['PENDING', 'PAID', 'CANCELED', 'EXPIRED']).optional(),
                search: z.string().optional()
            })
        }
    }, orderController.listOrders);

    fastify.get('/:id', orderController.getOrderDetails);
    fastify.post('/:id/notes', orderController.addOrderNote);
}
