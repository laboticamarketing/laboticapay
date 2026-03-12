import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { getRedeClient } from '../lib/rede';
import { config } from '../config/env';
import * as redePix from '../services/redePix.service';

const Transaction = require('erede-node/lib/transaction');

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const criarBodySchema = z.object({
    valor: z.coerce.number().int().positive(),
    referencia: z.string().min(1),
    orderId: z.string().regex(uuidRegex).optional(),
    numeroCartao: z.string().min(13).max(19),
    cvv: z.string().min(3).max(4),
    mesValidade: z.string().min(1).max(2),
    anoValidade: z.string().min(2).max(4),
    nomeCartao: z.string().min(1),
    parcelas: z.coerce.number().int().min(1).default(1),
});

const cancelarBodySchema = z.object({
    tid: z.string().min(1),
    valor: z.coerce.number().int().positive().optional(),
});

/**
 * POST /pagamento/criar
 * Processa pagamento via e.Rede e persiste em RedeTransaction
 */
export const criar = async (
    request: FastifyRequest<{ Body: z.infer<typeof criarBodySchema> }>,
    reply: FastifyReply
) => {
    const parseResult = criarBodySchema.safeParse(request.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            sucesso: false,
            returnMessage: 'Dados inválidos',
            details: parseResult.error.flatten(),
        });
    }

    const { valor, referencia, orderId, numeroCartao, cvv, mesValidade, anoValidade, nomeCartao, parcelas } =
        parseResult.data;

    if (!config.rede.pv || !config.rede.token) {
        return reply.status(503).send({
            sucesso: false,
            returnMessage: 'Gateway de pagamento não configurado',
        });
    }

    try {
        const rede = getRedeClient();
        const amountReais = valor / 100;

        const transaction = new Transaction(amountReais, referencia, parcelas).creditCard(
            numeroCartao.replace(/\s/g, ''),
            cvv,
            mesValidade.padStart(2, '0'),
            anoValidade.length === 2 ? `20${anoValidade}` : anoValidade,
            nomeCartao
        );

        const result = await rede.create(transaction);

        const returnCode = result.returnCode ?? '';
        const returnMessage = result.returnMessage ?? '';
        const tid = result.tid ?? null;
        const status = returnCode === '00' ? 'aprovado' : 'negado';
        const targetOrderId = orderId ?? (uuidRegex.test(referencia) ? referencia : null);

        await prisma.redeTransaction.create({
            data: {
                referencia,
                tid,
                status,
                valor,
                parcelas,
                returnCode,
                returnMessage,
                payload: result as object,
                orderId: targetOrderId ?? undefined,
            },
        });

        if (returnCode === '00' && targetOrderId) {
            const order = await prisma.order.findUnique({
                where: { id: targetOrderId },
            });
            if (order && order.status !== 'PAID') {
                await prisma.order.update({
                    where: { id: targetOrderId },
                    data: { status: 'PAID' },
                });
                const amountReais = valor / 100;
                await prisma.paymentTransaction.create({
                    data: {
                        orderId: targetOrderId,
                        gatewayId: tid ?? `rede-${Date.now()}`,
                        type: 'CARD',
                        status: 'CONFIRMED',
                        amount: amountReais,
                        metadata: { tid, returnCode, returnMessage },
                    },
                });
            }
        }

        return reply.send({
            sucesso: returnCode === '00',
            tid,
            returnCode,
            returnMessage,
        });
    } catch (error: unknown) {
        request.log.error(error);

        const message =
            error && typeof error === 'object' && 'returnMessage' in error
                ? String((error as { returnMessage?: string }).returnMessage)
                : 'Falha ao processar pagamento. Tente novamente.';

        return reply.status(500).send({
            sucesso: false,
            returnMessage: message,
        });
    }
};

/**
 * POST /pagamento/cancelar
 * Cancela transação na Rede e atualiza status no banco
 */
export const cancelar = async (
    request: FastifyRequest<{ Body: z.infer<typeof cancelarBodySchema> }>,
    reply: FastifyReply
) => {
    const parseResult = cancelarBodySchema.safeParse(request.body);
    if (!parseResult.success) {
        return reply.status(400).send({
            sucesso: false,
            mensagem: 'Dados inválidos',
            details: parseResult.error.flatten(),
        });
    }

    const { tid, valor } = parseResult.data;

    if (!config.rede.pv || !config.rede.token) {
        return reply.status(503).send({
            sucesso: false,
            mensagem: 'Gateway de pagamento não configurado',
        });
    }

    try {
        const rede = getRedeClient();
        const cancelPayload: { tid: string; amount?: number } = { tid };
        if (valor !== undefined) {
            cancelPayload.amount = valor / 100;
        }

        const result = await rede.cancel(cancelPayload);

        const returnCode = result.returnCode ?? '';

        if (returnCode === '00') {
            await prisma.redeTransaction.updateMany({
                where: { tid },
                data: { status: 'cancelado' },
            });
        }

        return reply.send({
            sucesso: returnCode === '00',
            mensagem: result.returnMessage ?? (returnCode === '00' ? 'Cancelamento realizado' : 'Falha no cancelamento'),
        });
    } catch (error: unknown) {
        request.log.error(error);

        const message =
            error && typeof error === 'object' && 'returnMessage' in error
                ? String((error as { returnMessage?: string }).returnMessage)
                : 'Falha ao cancelar transação. Tente novamente.';

        return reply.status(500).send({
            sucesso: false,
            mensagem: message,
        });
    }
};

/**
 * GET /pagamento/consultar/:tid
 * Consulta status da transação na Rede pelo TID
 */
export const consultar = async (
    request: FastifyRequest<{ Params: { tid: string } }>,
    reply: FastifyReply
) => {
    const { tid } = request.params;

    if (!tid) {
        return reply.status(400).send({ message: 'TID é obrigatório' });
    }

    if (!config.rede.pv || !config.rede.token) {
        return reply.status(503).send({
            message: 'Gateway de pagamento não configurado',
        });
    }

    try {
        const rede = getRedeClient();
        const transaction = await rede.getByTid(tid);
        return reply.send(transaction);
    } catch (error: unknown) {
        request.log.error(error);

        const message =
            error && typeof error === 'object' && 'returnMessage' in error
                ? String((error as { returnMessage?: string }).returnMessage)
                : 'Transação não encontrada ou erro ao consultar.';

        return reply.status(404).send({
            message,
        });
    }
};

const pixCriarBodySchema = z.object({
    valor: z.coerce.number().int().positive(),
    referencia: z.string().min(1),
    orderId: z.string().uuid().optional(),
});

/**
 * POST /pagamento/pix/criar
 * Cria QR Code PIX e retorna para exibição no checkout
 */
export const criarPix = async (
    request: FastifyRequest<{ Body: z.infer<typeof pixCriarBodySchema> }>,
    reply: FastifyReply
) => {
    const parseResult = pixCriarBodySchema.safeParse(request.body);
    if (!parseResult.success) {
        const details = parseResult.error.flatten();
        request.log.warn({ body: request.body, details }, 'PIX criar: validação falhou');
        return reply.status(400).send({
            success: false,
            message: 'Dados inválidos',
            details,
        });
    }

    const { valor, referencia, orderId } = parseResult.data;

    const result = await redePix.criarQrCodePix(valor, referencia, orderId);

    if (!result.success) {
        request.log.warn({ valor, referencia, orderId, returnMessage: result.returnMessage }, 'PIX criar: Rede retornou erro');
        return reply.status(400).send({
            success: false,
            message: result.returnMessage ?? 'Falha ao criar QR Code PIX',
        });
    }

    if (!result.tid) {
        return reply.status(500).send({
            success: false,
            message: 'Resposta inválida da Rede',
        });
    }

    const targetOrderId = orderId ?? (uuidRegex.test(referencia) ? referencia : null);
    const amountReais = valor / 100;

    if (targetOrderId) {
        const order = await prisma.order.findUnique({
            where: { id: targetOrderId },
        });
        if (order && order.status !== 'PAID') {
            await prisma.paymentTransaction.create({
                data: {
                    orderId: targetOrderId,
                    gatewayId: result.tid,
                    type: 'PIX',
                    status: 'PENDING',
                    amount: amountReais,
                    metadata: {
                        tid: result.tid,
                        qrCodeBase64: result.qrCodeBase64,
                        qrCodeText: result.qrCodeText,
                    },
                },
            });
        }
    }

    return reply.send({
        success: true,
        tid: result.tid,
        qrCodeBase64: result.qrCodeBase64,
        qrCodeText: result.qrCodeText,
        expiresAt: result.expiresAt,
    });
};

/**
 * GET /pagamento/pix/consultar/:tid
 * Consulta status de transação PIX para polling no frontend
 */
export const consultarPix = async (
    request: FastifyRequest<{ Params: { tid: string } }>,
    reply: FastifyReply
) => {
    const { tid } = request.params;

    if (!tid) {
        return reply.status(400).send({ status: 'PENDING', message: 'TID é obrigatório' });
    }

    const result = await redePix.consultarPix(tid);

    if (!result) {
        return reply.send({ status: 'PENDING', tid, message: 'Consultando...' });
    }

    if (result.status === 'PAID') {
        const transaction = await prisma.paymentTransaction.findFirst({
            where: { gatewayId: tid },
        });
        if (transaction) {
            await prisma.paymentTransaction.update({
                where: { id: transaction.id },
                data: { status: 'CONFIRMED' },
            });
            await prisma.order.update({
                where: { id: transaction.orderId },
                data: { status: 'PAID' },
            });
        }
    }

    return reply.send({
        status: result.status,
        tid: result.tid,
        message: result.status === 'PAID' ? 'Pagamento confirmado' : 'Aguardando pagamento',
    });
};
