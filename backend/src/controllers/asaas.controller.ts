import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../server';

interface AsaasWebhookPayload {
    event: string;
    payment: {
        id: string;
        customer: string;
        value: number;
        netValue: number;
        billingType: string;
        status: string;
        externalReference?: string;
    }
}

export const handleAsaasWebhook = async (request: FastifyRequest<{ Body: AsaasWebhookPayload }>, reply: FastifyReply) => {
    const { event, payment } = request.body;
    const asaasAccessToken = request.headers['asaas-access-token'];

    // 1. Security Check
    if (process.env.ASAAS_WEBHOOK_SECRET && asaasAccessToken !== process.env.ASAAS_WEBHOOK_SECRET) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    // 2. Idempotency Check
    const eventId = (request.body as any).id; // Assuming Asaas sends a unique ID for the event
    if (eventId) {
        const existingEvent = await prisma.webhookEvent.findUnique({ where: { eventId } });
        if (existingEvent) {
            return reply.status(200).send({ message: 'Event already processed' });
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 3. Log Event
            if (eventId) {
                await tx.webhookEvent.create({
                    data: {
                        eventId,
                        payload: request.body as any,
                        status: 'PROCESSING'
                    }
                });
            }

            // 4. Process Payment Events
            if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
                const paymentLink = await tx.paymentLink.findUnique({
                    where: { asaasPaymentId: payment.id },
                    include: { order: true }
                });

                if (paymentLink) {
                    // Update PaymentLink Status
                    await tx.paymentLink.update({
                        where: { id: paymentLink.id },
                        data: { status: 'PAID' }
                    });

                    // Update Order Status
                    await tx.order.update({
                        where: { id: paymentLink.orderId },
                        data: { status: 'PAID' }
                    });

                    // Create Transaction Record
                    await tx.paymentTransaction.create({
                        data: {
                            orderId: paymentLink.orderId,
                            gatewayId: payment.id,
                            type: payment.billingType,
                            status: 'CONFIRMED',
                            amount: payment.value,
                            metadata: payment as any
                        }
                    });
                }
            } else if (event === 'PAYMENT_OVERDUE') {
                // Handle expiration
                const paymentLink = await tx.paymentLink.findUnique({
                    where: { asaasPaymentId: payment.id }
                });

                if (paymentLink) {
                    await tx.order.update({
                        where: { id: paymentLink.orderId },
                        data: { status: 'EXPIRED' }
                    });
                }
            }

            // Update event status to SUCCESS
            if (eventId) {
                await tx.webhookEvent.update({
                    where: { eventId },
                    data: { status: 'SUCCESS' }
                });
            }
        });

        return reply.status(200).send({ received: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        // Log failure
        if (eventId) {
            await prisma.webhookEvent.update({
                where: { eventId },
                data: { status: 'FAILED' }
            });
        }
        return reply.status(500).send({ error: 'Internal Server Error' });
    }
};
