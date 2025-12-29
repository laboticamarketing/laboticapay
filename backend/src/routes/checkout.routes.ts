import { FastifyInstance } from 'fastify';
import * as orderController from '../controllers/order.controller';

export async function checkoutRoutes(fastify: FastifyInstance) {
    // Public routes - No JWT required
    fastify.post('/:id', orderController.processCheckout);
    fastify.post('/:id/upload', orderController.uploadAttachment); // Upload endpoint
    // Add get endpoint to fetch order details for the public checkout page
    fastify.get('/:id', orderController.getOrderDetails);

    // Address management for checkout
    fastify.delete('/:id/address/:addressId', orderController.deleteCheckoutAddress);
}
