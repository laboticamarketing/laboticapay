import { FastifyInstance } from 'fastify';
import * as asaasController from '../controllers/asaas.controller';

export async function asaasRoutes(fastify: FastifyInstance) {
    // Public route for Webhook (secured by header check inside controller)
    fastify.post('/webhooks/asaas', asaasController.handleAsaasWebhook);
}
