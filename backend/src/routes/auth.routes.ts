import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', authController.login);

    fastify.get('/me', {
        onRequest: [async (request) => await request.jwtVerify()]
    }, authController.getMe);

    fastify.put('/me', {
        onRequest: [async (request) => await request.jwtVerify()]
    }, authController.updateMe);

    fastify.post('/me/avatar', {
        onRequest: [async (request) => await request.jwtVerify()]
    }, authController.uploadAvatar);

    fastify.post('/me/revoke-sessions', {
        onRequest: [async (request) => await request.jwtVerify()]
    }, authController.revokeSessions);
}
