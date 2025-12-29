import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export const globalErrorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // Log error
    request.log.error(error);

    // Zod Validation Errors
    if (error instanceof ZodError) {
        return reply.status(400).send({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Validation Error',
            details: error.flatten()
        });
    }

    // Prisma Errors (Basic mapping, can be expanded)
    if (error.code === 'P2002') {
        return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: 'Unique constraint violation'
        });
    }

    if (error.code === 'P2025') {
        return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Record not found'
        });
    }

    // Default Error
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // Hide stack in production (optional, but good practice)
    // if (process.env.NODE_ENV === 'production') ...

    return reply.status(statusCode).send({
        statusCode,
        error: error.name || 'Internal Server Error',
        message
    });
};
