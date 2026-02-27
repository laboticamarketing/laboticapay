import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';

/**
 * AbacatePay Webhook Handler
 * 
 * Events:
 * - billing.paid: When a billing is paid (PIX or Card)
 * 
 * Webhook payload structure:
 * {
 *   "id": "log_12345abcdef",
 *   "data": {
 *     "payment": { "amount": 1000, "fee": 80, "method": "PIX" },
 *     "billing": { ... } | "pixQrCode": { ... }
 *   },
 *   "devMode": false,
 *   "event": "billing.paid"
 * }
 */

interface WebhookPayload {
    id: string;
    data: {
        payment: {
            amount: number;
            fee: number;
            method: string;
        };
        billing?: {
            id: string;
            amount: number;
            customer: {
                id: string;
                metadata: {
                    name: string;
                    email: string;
                    cellphone: string;
                    taxId: string;
                };
            };
            products: { id: string; externalId: string; quantity: number }[];
            status: string;
            paidAmount: number;
            frequency: string;
            kind: string[];
            couponsUsed: string[];
        };
        pixQrCode?: {
            id: string;
            amount: number;
            kind: string;
            status: string;
        };
    };
    devMode: boolean;
    event: string;
}

export async function webhookRoutes(fastify: FastifyInstance) {

    // AbacatePay Webhook
    fastify.post('/abacatepay', async (request: FastifyRequest, reply: FastifyReply) => {
        const { webhookSecret } = (request.query || {}) as { webhookSecret?: string };

        if (config.abacatepay.webhookSecret) {
            if (!webhookSecret || webhookSecret !== config.abacatepay.webhookSecret) {
                request.log.warn('[Webhook] Invalid AbacatePay webhook secret');
                return reply.status(401).send({ message: 'Invalid webhook secret' });
            }
        } else {
            request.log.warn('[Webhook] AbacatePay webhook secret not configured; skipping secret validation');
        }

        const payload = request.body as WebhookPayload;

        try {
            // 1. Idempotency check
            const existingEvent = await prisma.webhookEvent.findUnique({
                where: { eventId: payload.id }
            });

            if (existingEvent) {
                return reply.status(200).send({ message: 'Event already processed' });
            }

            // 2. Store webhook event
            await prisma.webhookEvent.create({
                data: {
                    eventId: payload.id,
                    payload: payload as any,
                    status: 'PROCESSING',
                }
            });

            // 3. Process event
            if (payload.event === 'billing.paid') {
                await handleBillingPaid(payload, request);
            }

            // 4. Mark as processed
            await prisma.webhookEvent.update({
                where: { eventId: payload.id },
                data: { status: 'SUCCESS' }
            });

            return reply.status(200).send({ message: 'Webhook processed' });

        } catch (error: any) {
            request.log.error(error, '[Webhook] Processing error');

            // Mark as failed if event was created
            try {
                await prisma.webhookEvent.update({
                    where: { eventId: payload.id },
                    data: { status: 'FAILED' }
                });
            } catch {
                // Event might not exist yet
            }

            return reply.status(200).send({ message: 'Webhook received (processing error logged)' });
        }
    });
}

async function handleBillingPaid(payload: WebhookPayload, request: FastifyRequest) {
    const { billing, pixQrCode, payment } = payload.data;

    // Find the order via billing externalId or transaction gatewayId
    let order = null;

    if (billing) {
        // Billing flow: externalId was set to orderId
        const billingId = billing.id;

        // Look up by PaymentLink or PaymentTransaction
        const link = await prisma.paymentLink.findFirst({
            where: { asaasPaymentId: billingId }
        });

        if (link) {
            order = await prisma.order.findUnique({ where: { id: link.orderId } });
        }

        if (!order) {
            // Try via externalId in products
            const externalId = billing.products?.[0]?.externalId;
            if (externalId) {
                order = await prisma.order.findUnique({ where: { id: externalId } });
            }
        }
    }

    if (pixQrCode) {
        // PIX flow: look up by pixId in transaction metadata
        const transaction = await prisma.paymentTransaction.findFirst({
            where: {
                gatewayId: pixQrCode.id
            }
        });

        if (transaction) {
            order = await prisma.order.findUnique({ where: { id: transaction.orderId } });
        }
    }

    if (!order) {
        request.log.warn(`[Webhook] Order not found for event ${payload.id}`);
        return;
    }

    if (order.status === 'PAID') {
        request.log.info(`[Webhook] Order ${order.id} already PAID, skipping`);
        return;
    }

    // Normalize payment method (PIX or CARD) when available
    const normalizedMethod = payment?.method
        ? payment.method.toUpperCase()
        : undefined;

    // Update order status to PAID
    await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' }
    });

    // Update payment link status if exists
    await prisma.paymentLink.updateMany({
        where: { orderId: order.id },
        data: { status: 'PAID' }
    });

    // Update pending transactions to CONFIRMED and, when known,
    // persist the final payment method (PIX or CARD) in the type field
    const transactionUpdateData: any = { status: 'CONFIRMED' };
    if (normalizedMethod) {
        transactionUpdateData.type = normalizedMethod;
    }

    await prisma.paymentTransaction.updateMany({
        where: {
            orderId: order.id,
            status: 'PENDING',
        },
        data: transactionUpdateData
    });

    request.log.info(`[Webhook] Order ${order.id} marked as PAID via ${payment?.method || 'UNKNOWN'}`);
}
