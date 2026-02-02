import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors/AppError';
import { config } from '../config/env';

/**
 * Mapeia erros do Prisma para códigos HTTP apropriados
 */
function mapPrismaError(error: any): { statusCode: number; message: string } {
    switch (error.code) {
        case 'P2002':
            return { statusCode: 409, message: 'Unique constraint violation' };
        case 'P2025':
            return { statusCode: 404, message: 'Record not found' };
        case 'P2003':
            return { statusCode: 400, message: 'Foreign key constraint failed' };
        case 'P2014':
            return { statusCode: 400, message: 'Required relation is missing' };
        default:
            return { statusCode: 500, message: 'Database error' };
    }
}

export const globalErrorHandler = (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    // Log error
    request.log.error(error);

    // AppError (erros customizados da aplicação)
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            statusCode: error.statusCode,
            error: error.name,
            message: error.message
        });
    }

    // Zod Validation Errors
    if (error instanceof ZodError) {
        return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: 'Invalid request data',
            details: error.flatten()
        });
    }

    // Prisma Errors
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
        const prismaError = mapPrismaError(error);
        return reply.status(prismaError.statusCode).send({
            statusCode: prismaError.statusCode,
            error: 'Database Error',
            message: prismaError.message
        });
    }

    // Fastify Errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
        const fastifyError = error as FastifyError;
        return reply.status(fastifyError.statusCode || 500).send({
            statusCode: fastifyError.statusCode || 500,
            error: fastifyError.name || 'Error',
            message: fastifyError.message || 'Internal Server Error'
        });
    }

    // Default Error (erros não tratados)
    const statusCode = 500;
    const message = error.message || 'Internal Server Error';

    // Em produção, não expor detalhes do erro
    const response: any = {
        statusCode,
        error: 'Internal Server Error',
        message: config.server.isProduction ? 'An unexpected error occurred' : message
    };

    // Em desenvolvimento, incluir stack trace
    if (config.server.isDevelopment && error.stack) {
        response.stack = error.stack;
    }

    return reply.status(statusCode).send(response);
};
