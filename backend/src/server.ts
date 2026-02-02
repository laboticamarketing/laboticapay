import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import path from 'path';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { globalErrorHandler } from './lib/errorHandler';
import { prisma, disconnectPrisma } from './lib/prisma';
import { config } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { customerRoutes } from './routes/customer.routes';
import { orderRoutes } from './routes/order.routes';
import { asaasRoutes } from './routes/asaas.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { checkoutRoutes } from './routes/checkout.routes';

const server = Fastify({
    logger: true
});

// Zod Validation Setup
server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

// Global Error Handler
server.setErrorHandler(globalErrorHandler);

// Security: Helmet
server.register(helmet, {
    global: true,
    contentSecurityPolicy: false
});

// Security: Rate Limit
server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
});

// Register CORS
server.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
});

// Register Multipart
server.register(multipart, {
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Register Static Files
server.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
});

// Register JWT
server.register(fastifyJwt, {
    secret: config.auth.jwtSecret
});

// Register Routes
server.register(authRoutes, { prefix: '/auth' });
server.register(customerRoutes, { prefix: '/customers' });
server.register(orderRoutes, { prefix: '/orders' });
server.register(dashboardRoutes, { prefix: '/dashboard' });
server.register(checkoutRoutes, { prefix: '/checkout' }); // New public route
server.register(asaasRoutes); // Root level for webhooks usually, or /api

// Health Check
server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date() };
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, starting graceful shutdown...`);
    try {
        await server.close();
        await disconnectPrisma();
        server.log.info('Graceful shutdown completed');
        process.exit(0);
    } catch (err) {
        server.log.error(err as any, 'Error during graceful shutdown:');
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Run the server
const start = async () => {
    try {
        await server.listen({ port: config.server.port, host: '0.0.0.0' });
        console.log(`Server is running at http://localhost:${config.server.port}`);
        console.log(`Environment: ${config.server.nodeEnv}`);
    } catch (err) {
        server.log.error(err as any);
        await disconnectPrisma();
        process.exit(1);
    }
};

start();
