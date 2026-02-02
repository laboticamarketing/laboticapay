import { FastifyRequest } from 'fastify';
import { config } from '../config/env';

/**
 * Utilitários de logging estruturado
 * Fornece funções auxiliares para logging consistente
 */

/**
 * Cria contexto de logging com informações da requisição
 */
export function createRequestContext(request: FastifyRequest): Record<string, any> {
    const user = (request as any).user;
    return {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userId: user?.id,
        userEmail: user?.email,
        requestId: request.id,
    };
}

/**
 * Log de erro com contexto da requisição
 */
export function logError(logger: any, error: Error, request?: FastifyRequest, context?: Record<string, any>) {
    const logContext: Record<string, any> = {
        error: {
            name: error.name,
            message: error.message,
            stack: config.server.isDevelopment ? error.stack : undefined,
        },
        ...context,
    };

    if (request) {
        Object.assign(logContext, createRequestContext(request));
    }

    logger.error(logContext, error.message);
}

/**
 * Log de informação com contexto
 */
export function logInfo(logger: any, message: string, request?: FastifyRequest, context?: Record<string, any>) {
    const logContext: Record<string, any> = {
        ...context,
    };

    if (request) {
        Object.assign(logContext, createRequestContext(request));
    }

    logger.info(logContext, message);
}

/**
 * Log de warning com contexto
 */
export function logWarn(logger: any, message: string, request?: FastifyRequest, context?: Record<string, any>) {
    const logContext: Record<string, any> = {
        ...context,
    };

    if (request) {
        Object.assign(logContext, createRequestContext(request));
    }

    logger.warn(logContext, message);
}
