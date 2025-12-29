import { FastifyInstance } from 'fastify';
import * as customerController from '../controllers/customer.controller';

export async function customerRoutes(fastify: FastifyInstance) {
    // Protected routes - ensure JWT verification
    fastify.addHook('onRequest', async (request, reply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.post('/', customerController.createCustomer);
    fastify.get('/', customerController.listCustomers);
    fastify.get('/:id', customerController.getCustomer);
    fastify.put('/:id', customerController.updateCustomer);
    fastify.post('/:id/notes', customerController.addCustomerNote);
}
