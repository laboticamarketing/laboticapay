import { FastifyRequest, FastifyReply } from 'fastify';

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
