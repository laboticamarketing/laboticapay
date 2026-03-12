import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';

/**
 * Payload esperado do webhook Rede PIX (PV.UPDATE_TRANSACTION_PIX)
 * Formato pode variar; suportamos estruturas comuns
 */
interface RedeWebhookPayload {
    event?: string;
    type?: string;
    tid?: string;
    events?: Array<{ event?: string; type?: string; tid?: string; transaction?: { tid?: string } }>;
    transaction?: { tid?: string };
}

/**
 * POST /webhooks/rede-pix
 * Recebe notificação da Rede quando PIX é pago (PV.UPDATE_TRANSACTION_PIX)
 * Deve responder 200 rapidamente; processamento assíncrono é ideal
 */
export const redePixWebhook = async (
    request: FastifyRequest<{ Body: RedeWebhookPayload }>,
    reply: FastifyReply
) => {
    const body = request.body as RedeWebhookPayload | undefined;

    if (!body || typeof body !== 'object') {
        return reply.status(400).send({ ok: false, message: 'Body inválido' });
    }

    let tid: string | undefined;
    let eventType: string | undefined;

    // Extrair event e tid de formatos possíveis
    if (body.event && body.tid) {
        eventType = body.event;
        tid = body.tid;
    } else if (body.type && body.tid) {
        eventType = body.type;
        tid = body.tid;
    } else if (Array.isArray(body.events) && body.events.length > 0) {
        const first = body.events[0];
        eventType = first.event ?? first.type;
        tid = first.tid ?? first.transaction?.tid;
    } else if (body.transaction?.tid) {
        tid = body.transaction.tid;
        eventType = body.event ?? body.type;
    }

    if (!tid) {
        request.log.warn({ body }, 'Webhook Rede PIX sem tid');
        return reply.status(200).send({ ok: true }); // 200 para evitar retries desnecessários
    }

    if (eventType && eventType !== 'PV.UPDATE_TRANSACTION_PIX') {
        request.log.info({ eventType, tid }, 'Webhook Rede: evento ignorado');
        return reply.status(200).send({ ok: true });
    }

    try {
        const transaction = await prisma.paymentTransaction.findFirst({
            where: { gatewayId: tid, type: 'PIX', status: 'PENDING' },
        });

        if (!transaction) {
            request.log.info({ tid }, 'Webhook Rede PIX: transação não encontrada ou já processada');
            return reply.status(200).send({ ok: true });
        }

        await prisma.$transaction([
            prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: { status: 'CONFIRMED' },
            }),
            prisma.order.update({
                where: { id: transaction.orderId },
                data: { status: 'PAID' },
            }),
        ]);

        request.log.info({ tid, orderId: transaction.orderId }, 'Webhook Rede PIX: pedido marcado como pago');
    } catch (error) {
        request.log.error(error, 'Erro ao processar webhook Rede PIX');
        return reply.status(500).send({ ok: false });
    }

    return reply.status(200).send({ ok: true });
};
