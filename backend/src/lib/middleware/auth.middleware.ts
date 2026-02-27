import { FastifyRequest, FastifyReply } from 'fastify';

type Role = 'ATTENDANT' | 'MANAGER' | 'ADMIN' | 'PHARMACIST';

/**
 * Middleware reutilizável para autenticação JWT
 * Verifica se o usuário está autenticado antes de acessar rotas protegidas
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Token inválido ou ausente. Por favor, faça login novamente.'
        });
    }
}

/**
 * Middleware para autorização baseada em papéis (Role)
 * Deve ser usado em rotas que já passam pelo requireAuth (para garantir que request.user exista)
 */
export function requireRole(...allowedRoles: Role[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = request.user as { role?: string } | undefined;

        if (!user || !user.role || !allowedRoles.includes(user.role as Role)) {
            return reply.status(403).send({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Você não tem permissão para acessar este recurso.'
            });
        }
    };
}

