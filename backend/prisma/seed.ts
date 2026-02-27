import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@farmapay.com';
    const password = 'Farma@2025!'; // Strong password
    const password_hash = await bcrypt.hash(password, 6);

    await prisma.profile.upsert({
        where: { email },
        update: { password_hash }, // Ensure password is updated if user exists
        create: {
            email,
            password_hash,
            name: 'Administrador',
            role: 'ADMIN',
        },
    });

    console.log(`User created: ${email} / ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
