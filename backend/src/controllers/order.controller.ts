import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../server';
import { asaasService } from '../services/asaas.service';
import { supabase } from '../lib/supabase';
import { customerService } from '../services/customer.service';

// Types for the request body
interface CreateOrderBody {
    customerId?: string;
    newCustomer?: {
        name: string;
        phone: string;
        cpf?: string;
        email?: string;
    };
    totalValue: number;
    shippingValue?: number;
    shippingType: 'DYNAMIC' | 'FIXED' | 'FREE';
    discountValue?: number;
    discountType?: 'FIXED' | 'PERCENTAGE';
    items: Array<{
        name: string;
        dosage?: string;
        actives?: string[];
        price?: number;
    }>;
    internalNotes?: string;
}

/**
 * Creates a new order for a specific customer.
 * 
 * This function handles:
 * - Validation of input data (implicitly via Zod if used, or manual checks).
 * - Creation of the Order record.
 * - Creation of associated OrderItems.
 * - Association with the logged-in user (Attendant).
 * 
 * @route POST /orders
 */
export const createOrder = async (request: FastifyRequest<{ Body: CreateOrderBody }>, reply: FastifyReply) => {
    const { customerId, newCustomer, totalValue, shippingValue, shippingType, discountValue, discountType, items, internalNotes } = request.body;
    const user = request.user as { id: string }; // From JWT

    try {
        let finalCustomerId = customerId;

        // 1. Handle Customer (Existing or New)
        // Only process newCustomer if name is provided (otherwise it's anonymous/placeholder)
        if (!finalCustomerId && newCustomer && newCustomer.name && newCustomer.name.trim() !== '') {
            const customer = await customerService.findOrCreate({
                name: newCustomer.name,
                phone: newCustomer.phone,
                email: newCustomer.email,
                cpf: newCustomer.cpf,
                createdById: user.id
            });
            finalCustomerId = customer.id;
        }

        // If no customer data provided, create a PLACEHOLDER customer (Anonymous)
        if (!finalCustomerId) {
            const placeholder = await customerService.createAnonymous();
            finalCustomerId = placeholder.id;
        }

        // 2. Create Order Transaction
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                customerId: finalCustomerId,
                totalValue,
                shippingValue,
                shippingType,
                discountValue,
                discountType,
                status: 'PENDING',
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        dosage: item.dosage,
                        actives: item.actives ? (item.actives as any) : undefined,
                        price: item.price
                    }))
                },
                notes: internalNotes ? {
                    create: {
                        content: internalNotes,
                        authorType: 'ATTENDANT',
                        authorId: user.id
                    }
                } : undefined
            },
            include: {
                customer: true,
                items: true
            }
        });

        // 3. Handle Payment Link Generation (Always Draft/Internal first)
        // logic changed: User wants ALWAYS internal link first to confirm data.

        await prisma.paymentLink.create({
            data: {
                orderId: order.id,
                status: 'WAITING_CUSTOMER', // Internal status
                asaasUrl: null, // Will be generated later in /checkout/:id
                asaasPaymentId: null
            }
        });

        /* 
           REMOVED: Automatic Asaas creation. 
           Now validation/creation happens strictly in processCheckout 
        */

        // 4. Refetch order with payment link to return to frontend
        const createdOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                customer: true,
                items: true,
                paymentLink: true,
                notes: {
                    include: { author: true }
                }
            }
        });

        reply.code(201).send(createdOrder);

    } catch (error: any) {
        if (error.code === 'P2003' && error.meta?.field_name?.includes('userId')) {
            reply.status(401).send({ error: 'Sessão inválida. Por favor, faça login novamente.' });
            return;
        }

        console.error('CRITICAL ERROR in createOrder:', error);
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to create order', details: error.message });
    }
};

export const listOrders = async (request: FastifyRequest<{ Querystring: { page?: string, limit?: string, status?: string, search?: string } }>, reply: FastifyReply) => {
    const page = Number(request.query.page) || 1;
    const limit = Number(request.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = request.query.status as any;
    const search = request.query.search;
    const user = request.user as { id: string, role: string };

    try {
        const whereClause: any = {};

        // Privacy Rule: Attendants can ONLY see their own orders
        if (user.role === 'ATTENDANT') {
            whereClause.userId = user.id;
        }

        if (status) {
            whereClause.status = status;
        }

        if (search) {
            whereClause.OR = [
                // Search in Customer fields
                { customer: { name: { contains: search, mode: 'insensitive' } } },
                { customer: { email: { contains: search, mode: 'insensitive' } } },
                { customer: { cpf: { contains: search } } },
                // Search in Order fields
                { id: { contains: search } }
            ];
        }

        // DEBUG SEARCH
        // DEBUG SEARCH
        console.log('DEBUG SEARCH PARAMS:', { search, status, whereClause: JSON.stringify(whereClause, null, 2) });

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                skip,
                take: limit,
                where: whereClause,
                include: {
                    customer: true,
                    paymentLink: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.order.count({ where: whereClause })
        ]);

        reply.send({
            data: orders,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to list orders' });
    }
};

/**
 * Retrieves full details of a specific order.
 * 
 * Includes:
 * - Customer information.
 * - Delivery address.
 * - List of items.
 * - Order notes (with authors).
 * - Payment transactions and link status.
 * 
 * @route GET /orders/:id
 */
export const getOrderDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    include: {
                        addresses: {
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                },
                address: true,
                items: true,
                notes: {
                    include: {
                        author: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                paymentLink: true,
                transactions: true,
                user: true // Include Attendant/User info
            }
        });

        if (!order) {
            return reply.status(404).send({ error: 'Order not found' });
        }

        reply.send(order);
    } catch (error) {
        reply.status(500).send({ error: 'Failed to get order details' });
    }
};

// ------------------------------------------------------------------
// NEW: Customer Checkout Endpoint
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// NEW: Customer Checkout Endpoint (Supports Partial & Final)
// ------------------------------------------------------------------
export const processCheckout = async (request: FastifyRequest<{
    Params: { id: string }, Body: {
        name: string;
        cpf: string;
        rg?: string;
        birthDate?: string;
        email: string;
        phone: string;
        addressId?: string; // NEW
        address?: {
            type?: string; // NEW
            zip?: string;
            street?: string;
            number?: string;
            neighborhood?: string;
            city?: string;
            state?: string;
            complement?: string;
        },
        partial?: boolean;
        notes?: string;
    }
}>, reply: FastifyReply) => {
    const { id } = request.params;
    const { name, cpf, rg, birthDate, email, phone, address, addressId, partial, notes } = request.body;

    try {
        // 1. Fetch Order
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                paymentLink: true,
                items: true,
                notes: {
                    include: { author: true }
                }
            }
        });

        if (!order) return reply.status(404).send({ error: 'Order not found' });
        // Allow updating even if not pending? Maybe restriction is good.
        if (order.status !== 'PENDING') return reply.status(400).send({ error: 'Order is not pending' });

        // 2. Validate/Update Customer
        let finalCustomerId = order.customerId;

        // Parse birthDate if present
        let birthDateObj: Date | undefined;
        if (birthDate) {
            // Assume format DD/MM/YYYY or YYYY-MM-DD
            if (birthDate.includes('/')) {
                const parts = birthDate.split('/');
                birthDateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
                birthDateObj = new Date(birthDate);
            }
        }

        // Check if a customer with this CPF already exists (and is NOT the current placeholder)
        if (cpf) {
            const existingCustomer = await prisma.customer.findUnique({
                where: { cpf },
                include: { addresses: true }
            });

            if (existingCustomer && existingCustomer.id !== finalCustomerId) {
                // Determine if we should switch to this existing customer
                // The current customer (finalCustomerId) is likely a placeholder.

                // 1. Update the Order to point to the existing customer
                await prisma.order.update({
                    where: { id: order.id },
                    data: { customerId: existingCustomer.id }
                });

                const oldPlaceholderId = finalCustomerId;
                finalCustomerId = existingCustomer.id;

                // 2. Try to delete the old placeholder if it has no other orders (cleanup)
                const otherOrders = await prisma.order.count({
                    where: { customerId: oldPlaceholderId }
                });

                if (otherOrders === 0) {
                    try {
                        await prisma.customer.delete({ where: { id: oldPlaceholderId } });
                    } catch (e) {
                        // Ignore delete error (maybe linked to something else)
                        request.log.warn(`Failed to delete placeholder customer ${oldPlaceholderId}`);
                    }
                }

                // SMART CHECKOUT LOGIC
                // If this is a partial update (Step 1), we do NOT want to overwrite the existing customer's data
                // with the potentially incomplete data from the form.
                // Instead, we return existing data so the frontend can skip to confirmation.
                if (partial) {
                    return reply.send({
                        success: true,
                        customerFound: true,
                        message: 'Cliente identificado.',
                        customer: existingCustomer,
                        orderId: id
                    });
                }
            }
        }

        // Handle Address (Create or Use Existing)
        let targetAddressId = addressId;

        if (address) {
            // Ensure only one primary address exists: unset previous ones
            await prisma.address.updateMany({
                where: { customerId: finalCustomerId, isPrimary: true },
                data: { isPrimary: false }
            });

            const newAddr = await prisma.address.create({
                data: {
                    customerId: finalCustomerId,
                    type: address.type || 'Casa',
                    zip: address.zip || '',
                    street: address.street || '',
                    number: address.number || '',
                    neighborhood: address.neighborhood || '',
                    city: address.city || '',
                    state: address.state || '',
                    complement: address.complement,
                    isPrimary: true
                }
            });
            targetAddressId = newAddr.id;
        }

        // Update customer profile data
        await prisma.customer.update({
            where: { id: finalCustomerId },
            data: {
                name,
                cpf,
                rg: rg || undefined,
                birthDate: birthDateObj || undefined,
                email,
                phone
            }
        });

        // Update Order with specific address
        if (targetAddressId) {
            await prisma.order.update({
                where: { id },
                data: { addressId: targetAddressId }
            });
        }

        // 2.5 Save Notes if provided
        if (notes && notes.trim() !== '') {
            // Check for duplicate/redundant note (avoid adding same note multiple times during checkout steps)
            const lastNote = await prisma.orderNote.findFirst({
                where: { orderId: id },
                orderBy: { createdAt: 'desc' }
            });

            if (!lastNote || lastNote.content !== notes) {
                await prisma.orderNote.create({
                    data: {
                        orderId: id,
                        content: notes,
                        authorType: 'CUSTOMER'
                    }
                });
            }
        }

        // 3. Early Exit if Partial Save
        if (partial) {
            return reply.send({ success: true, message: 'Dados salvos com sucesso.' });
        }

        // 4. Generate Asaas Link (if not exists)
        if (!order.paymentLink?.asaasUrl) {
            // Need address details for Asaas. 
            // If we have targetAddressId, fetch it. If provided in body, use it.
            let asaasAddr = {
                street: address?.street,
                number: address?.number,
                neighborhood: address?.neighborhood,
                zip: address?.zip
            };

            if (targetAddressId && !address) {
                const dbAddr = await prisma.address.findUnique({ where: { id: targetAddressId } });
                if (dbAddr) {
                    asaasAddr = {
                        street: dbAddr.street,
                        number: dbAddr.number,
                        neighborhood: dbAddr.neighborhood,
                        zip: dbAddr.zip
                    };
                }
            }

            // Create in Asaas
            const asaasCustomer = await asaasService.createCustomer({
                name,
                cpfCnpj: cpf,
                email,
                mobilePhone: phone,
                address: asaasAddr.street,
                addressNumber: asaasAddr.number,
                province: asaasAddr.neighborhood,
                postalCode: asaasAddr.zip
            });

            // Update local customer with Asaas ID
            await prisma.customer.update({
                where: { id: finalCustomerId },
                data: { asaasId: asaasCustomer.id }
            });

            // Calculate absolute discount for Asaas (sending as FIXED to match frontend logic)
            let discountObj: { value: number; type: 'FIXED' | 'PERCENTAGE' } | undefined = undefined;
            if (order.discountValue && Number(order.discountValue) > 0) {
                const totalFormula = Number(order.totalValue);
                let amount = 0;
                if (order.discountType === 'PERCENTAGE') {
                    // Discount on formula only
                    amount = (totalFormula * Number(order.discountValue)) / 100;
                } else {
                    amount = Number(order.discountValue);
                }
                // Safety math round
                amount = Math.round(amount * 100) / 100;

                discountObj = {
                    value: amount,
                    type: 'FIXED'
                };
            }

            const payment = await asaasService.createPaymentLink({
                customer: asaasCustomer.id,
                billingType: 'UNDEFINED',
                value: Number(order.totalValue) + Number(order.shippingValue || 0),
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                description: `Pedido Farmapay #${order.id}`,
                externalReference: order.id,
                discount: discountObj
            });

            // Update Payment Link
            if (order.paymentLink) {
                await prisma.paymentLink.update({
                    where: { id: order.paymentLink.id },
                    data: {
                        asaasPaymentId: payment.id,
                        asaasUrl: payment.invoiceUrl,
                        status: payment.status || 'PENDING'
                    }
                });
            } else {
                // Should have been created as draft, but if missing, create now
                await prisma.paymentLink.create({
                    data: {
                        orderId: order.id,
                        asaasPaymentId: payment.id,
                        asaasUrl: payment.invoiceUrl,
                        status: payment.status || 'PENDING'
                    }
                });
            }

            return reply.send({ redirectUrl: payment.invoiceUrl });
        } else {
            // Link already exists, return it
            return reply.send({ redirectUrl: order.paymentLink.asaasUrl });
        }

    } catch (error: any) {
        request.log.error(error);
        const errorData = error.response?.data || error.message;

        let errorMessage = "Erro ao processar checkout.";
        if (errorData?.errors && Array.isArray(errorData.errors)) {
            errorMessage += " " + errorData.errors.map((e: any) => e.description).join(", ");
        }

        reply.status(500).send({ error: errorMessage });
    }
};

export const addOrderNote = async (request: FastifyRequest<{ Params: { id: string }, Body: { content: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { content } = request.body;
    const user = request.user as { id: string };

    try {
        const note = await prisma.orderNote.create({
            data: {
                orderId: id,
                content,
                authorId: user?.id,
                authorType: 'ATTENDANT'
            },
            include: {
                author: true
            }
        });
        reply.code(201).send(note);
    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to add note' });
    }
};

export const uploadAttachment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
        const part = await request.file();
        if (!part) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        const buffer = await part.toBuffer();
        // Sanitize filename to avoid weird chars
        const safeName = part.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;
        const filePath = `${id}/${filename}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('prescriptions')
            .upload(filePath, buffer, {
                contentType: part.mimetype,
                upsert: true
            });

        if (uploadError) {
            request.log.error(uploadError);
            return reply.status(500).send({ error: 'Failed to upload to storage: ' + uploadError.message });
        }

        const { data: publicData } = supabase.storage
            .from('prescriptions')
            .getPublicUrl(uploadData.path);

        const attachmentUrl = publicData.publicUrl;

        await prisma.order.update({
            where: { id },
            data: { attachmentUrl }
        });

        return reply.send({ success: true, attachmentUrl });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to upload attachment' });
    }
};

export const getOrderStats = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const [pendingCount, canceledCount, paidTodayAgg] = await Promise.all([
            prisma.order.count({ where: { status: 'PENDING' } }),
            prisma.order.count({ where: { status: 'CANCELED' } }),
            prisma.order.aggregate({
                _sum: { totalValue: true, shippingValue: true },
                where: {
                    status: 'PAID',
                    updatedAt: {
                        gte: startOfToday,
                        lte: endOfToday
                    }
                }
            })
        ]);

        const paidToday = (Number(paidTodayAgg._sum.totalValue) || 0) + (Number(paidTodayAgg._sum.shippingValue) || 0);

        reply.send({
            pending: pendingCount,
            canceled: canceledCount,
            paidToday
        });

    } catch (error) {
        request.log.error(error);
        reply.status(500).send({ error: 'Failed to get order stats' });
    }
};

export const deleteCheckoutAddress = async (request: FastifyRequest<{ Params: { id: string, addressId: string } }>, reply: FastifyReply) => {
    const { id, addressId } = request.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            select: { customerId: true, addressId: true, status: true }
        });

        if (!order) return reply.status(404).send({ error: 'Order not found' });
        if (order.status !== 'PENDING') return reply.status(400).send({ error: 'Cannot delete address from processed order' });

        const address = await prisma.address.findFirst({
            where: { id: addressId, customerId: order.customerId }
        });

        if (!address) return reply.status(404).send({ error: 'Address not found for this customer' });

        if (order.addressId === addressId) {
            await prisma.order.update({
                where: { id },
                data: { addressId: null }
            });
        }

        await prisma.address.delete({
            where: { id: addressId }
        });

        return reply.send({ success: true });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to delete address' });
    }
};
