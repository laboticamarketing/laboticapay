import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createCustomer = async (request: FastifyRequest<{ Body: { name: string; email?: string; phone: string; cpf?: string; birthDate?: string; addresses?: any[]; notes?: string } }>, reply: FastifyReply) => {
    const { name, email, phone, cpf, birthDate, addresses, notes } = request.body;

    try {
        const existing = cpf ? await prisma.customer.findUnique({ where: { cpf } }) : null;
        if (existing) {
            return reply.status(409).send({ message: 'Customer already exists' });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                cpf,
                notes,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                addresses: addresses ? {
                    create: addresses.map(addr => ({
                        type: addr.type || 'Casa',
                        zip: addr.zip || '',
                        street: addr.street || '',
                        number: addr.number || '',
                        neighborhood: addr.neighborhood || '',
                        city: addr.city || '',
                        state: addr.state || '',
                        complement: addr.complement,
                        isPrimary: addr.isPrimary || false
                    }))
                } : undefined
            },
            include: { addresses: true }
        });

        return reply.status(201).send(customer);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const updateCustomer = async (request: FastifyRequest<{ Params: { id: string }, Body: { name?: string; email?: string; phone?: string; cpf?: string; birthDate?: string; addresses?: any[]; notes?: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { name, email, phone, cpf, birthDate, addresses, notes } = request.body;

    try {
        // Transaction to update customer and replace addresses
        const customer = await prisma.$transaction(async (tx) => {
            const updated = await tx.customer.update({
                where: { id },
                data: {
                    name,
                    email,
                    phone,
                    cpf,
                    notes,
                    birthDate: birthDate ? new Date(birthDate) : undefined,
                }
            });

            if (addresses) {
                // Delete existing addresses
                await tx.address.deleteMany({ where: { customerId: id } });

                // Create new addresses
                if (addresses.length > 0) {
                    await tx.address.createMany({
                        data: addresses.map(addr => ({
                            customerId: id,
                            type: addr.type || 'Casa',
                            zip: addr.zip || '',
                            street: addr.street || '',
                            number: addr.number || '',
                            neighborhood: addr.neighborhood || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            complement: addr.complement,
                            isPrimary: addr.isPrimary || false
                        }))
                    });
                }
            }

            return updated;
        });

        return reply.send(customer);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const listCustomers = async (request: FastifyRequest<{ Querystring: { search?: string; page?: number; limit?: number } }>, reply: FastifyReply) => {
    const { search, page = 1, limit = 10 } = request.query;
    const skip = (page - 1) * limit;

    try {
        const whereClause: any = {};
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search } }
            ];
        }

        const [customers, total] = await prisma.$transaction([
            prisma.customer.findMany({
                where: whereClause,
                skip: Number(skip),
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: { addresses: true } // Include addresses in list for display if needed
            }),
            prisma.customer.count({ where: whereClause })
        ]);

        return reply.send({
            data: customers,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const getCustomer = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                addresses: {
                    orderBy: { createdAt: 'desc' }
                },
                orders: {
                    include: { items: true },
                    orderBy: { createdAt: 'desc' }
                },
                customerNotes: {
                    include: { author: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!customer) {
            return reply.status(404).send({ message: 'Customer not found' });
        }

        return reply.send(customer);
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

export const addCustomerNote = async (request: FastifyRequest<{ Params: { id: string }, Body: { content: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { content } = request.body;
    const user = request.user as { id: string };

    try {
        const note = await prisma.customerNote.create({
            data: {
                customerId: id,
                content,
                authorId: user?.id
            },
            include: {
                author: true
            }
        });
        reply.code(201).send(note);
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to add customer note' });
    }
};
