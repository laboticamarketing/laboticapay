import { FastifyInstance } from 'fastify';
import * as customerController from '../controllers/customer.controller';
import { requireAuth } from '../lib/middleware/auth.middleware';

export async function customerRoutes(fastify: FastifyInstance) {
    // Protected routes - ensure JWT verification
    fastify.addHook('onRequest', requireAuth);

    fastify.post('/', customerController.createCustomer);
    fastify.get('/', customerController.listCustomers);
    fastify.get('/:id', customerController.getCustomer);
    fastify.put('/:id', customerController.updateCustomer);
    fastify.post('/:id/notes', customerController.addCustomerNote);
}
