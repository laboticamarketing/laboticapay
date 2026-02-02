import { PrismaClient } from '@prisma/client';
import { config } from '../config/env';

// Singleton pattern para garantir uma única instância do PrismaClient
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: config.server.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
});

if (!config.server.isProduction) {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown helper
export async function disconnectPrisma(): Promise<void> {
    await prisma.$disconnect();
}
