import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // const email = 'admin@farmapay.com';
    // const password = 'Farma@2025!'; // Strong password
    // const password_hash = await bcrypt.hash(password, 6);

    // await prisma.profile.upsert({
    //     where: { email },
    //     update: { password_hash }, // Ensure password is updated if user exists
    //     create: {
    //         email,
    //         password_hash,
    //         name: 'Administrador',
    //         role: 'ADMIN',
    //     },
    // });

    // console.log(`User created: ${email} / ${password}`);

    const attendantEmail = 'atendente@farmapay.com';
    const attendantPassword = 'Farma@2025!';
    const attendantPasswordHash = await bcrypt.hash(attendantPassword, 6);

    await prisma.profile.upsert({
        where: { email: attendantEmail },
        update: { password_hash: attendantPasswordHash }, // Ensure password is updated
        create: {
            email: attendantEmail,
            password_hash: attendantPasswordHash,
            name: 'Atendente Padrão',
            role: 'ATTENDANT',
        },
    });

    console.log(`User created: ${attendantEmail} / ${attendantPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
