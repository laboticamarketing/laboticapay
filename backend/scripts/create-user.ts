import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || 'Admin User';
    const role = process.argv[5] || 'ADMIN'; // ADMIN, MANAGER, SALES, ATTENDANT, INVESTOR

    if (!email || !password) {
        console.error('Usage: npx ts-node scripts/create-user.ts <email> <password> [name] [role]');
        console.error('Roles: ADMIN, MANAGER, SALES, ATTENDANT, INVESTOR');
        process.exit(1);
    }

    try {
        const hash = await bcrypt.hash(password, 6);

        const user = await prisma.profile.upsert({
            where: { email },
            update: {
                password_hash: hash,
                name,
                role: role as any
            },
            create: {
                id: crypto.randomUUID(),
                email,
                password_hash: hash,
                name,
                role: role as any
            }
        });

        console.log(`User ${user.email} created/updated successfully with role ${user.role}.`);
        console.log(`ID: ${user.id}`);

    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

createUser();
