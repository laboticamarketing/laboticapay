import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../lib/middleware/auth.middleware';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', authController.login);

    // Protected routes
    fastify.get('/me', { onRequest: requireAuth }, authController.getMe);
    fastify.put('/me', { onRequest: requireAuth }, authController.updateMe as any);
    fastify.post('/me/avatar', { onRequest: requireAuth }, authController.uploadAvatar);
    fastify.post('/me/revoke-sessions', { onRequest: requireAuth }, authController.revokeSessions);
}
