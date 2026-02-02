import { FastifyInstance } from 'fastify';
import * as checkoutController from '../controllers/checkout.controller';
import * as orderController from '../controllers/order.controller';

export async function checkoutRoutes(fastify: FastifyInstance) {
    // Public routes - No JWT required

    // Save Progress (Partial)
    fastify.post('/:id', checkoutController.saveProgress);

    // Process Payment (Rede)
    fastify.post('/:id/pay', checkoutController.processPayment);

    // Upload endpoint (Legacy/Shared? Or moved? Keeping logic in checkout.controller if moved, else orderController)
    // Actually I stubbed upload in checkoutController as Not Implemented. 
    // Ideally user uploads via orderController logic or I implement it.
    // The Frontend calls `/checkout/:id/upload`.
    fastify.post('/:id/upload', orderController.uploadAttachment);

    // Get Order Details
    fastify.get('/:id', checkoutController.getOrderDetails);

    // Address management for checkout
    fastify.delete('/:id/address/:addressId', checkoutController.deleteCheckoutAddress);
}
