/**
 * Classe base para erros customizados da aplicação
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erro para recursos não encontrados (404)
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Erro para requisições inválidas (400)
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}

/**
 * Erro para conflitos (409)
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

/**
 * Erro para não autorizado (401)
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Erro para acesso proibido (403)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}
