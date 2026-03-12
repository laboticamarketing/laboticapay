import { FastifyInstance } from 'fastify';
import * as webhookController from '../controllers/webhook.controller';

/**
 * Webhook routes - prefix /webhooks
 * URLs devem ser públicas (sem JWT) para receber callbacks de gateways
 */
export async function webhookRoutes(fastify: FastifyInstance) {
    // Rede PIX: PV.UPDATE_TRANSACTION_PIX
    // Registrar URL em POST /v2/transactions/notification-url (sandbox) ou no Portal Rede (produção)
    fastify.post('/rede-pix', webhookController.redePixWebhook);
}
