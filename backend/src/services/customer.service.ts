import { prisma } from '../lib/prisma';

interface CreateCustomerDTO {
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    createdById?: string;
}

export const customerService = {
    /**
     * Finds a customer by valid CPF or creates a new one.
     * Sanitizes inputs to prevent empty strings from violating uniqueness (if applicable).
     */
    async findOrCreate(data: CreateCustomerDTO) {
        // Sanitize
        const cpf = data.cpf && data.cpf.trim() !== '' ? data.cpf : undefined;
        const email = data.email && data.email.trim() !== '' ? data.email : undefined;

        // 1. Try to find by CPF if valid
        if (cpf) {
            const existing = await prisma.customer.findUnique({ where: { cpf } });
            if (existing) {
                return existing;
            }
        }

        // 2. Create New
        return prisma.customer.create({
            data: {
                name: data.name,
                phone: data.phone,
                email: email,
                cpf: cpf,
                createdById: data.createdById
            }
        });
    },

    /**
     * Creates an anonymous placeholder customer if no data is provided.
     */
    async createAnonymous(creatorId?: string) {
        return prisma.customer.create({
            data: {
                name: 'Cliente Não Identificado',
                phone: '',
                createdById: creatorId
            }
        });
    }
};
