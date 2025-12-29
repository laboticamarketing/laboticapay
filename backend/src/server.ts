import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { globalErrorHandler } from './lib/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { customerRoutes } from './routes/customer.routes';
import { orderRoutes } from './routes/order.routes';
import { asaasRoutes } from './routes/asaas.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { checkoutRoutes } from './routes/checkout.routes';

export const prisma = new PrismaClient();

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
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
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
    secret: process.env.JWT_SECRET || 'supersecret_change_me_in_prod'
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

// Run the server
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 4000;
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`Server is running at http://localhost:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
