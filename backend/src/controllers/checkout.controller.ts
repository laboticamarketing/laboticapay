import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { melhorEnvioService } from '../services/melhorenvio.service';
import { deleteCheckoutAddressService } from '../services/checkoutAddress.service';

/**
 * Public Endpoint: Get Order Details for Checkout Page
 */
export const getOrderDetails = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    include: { addresses: true }
                },
                items: true,
                paymentLink: true,
                notes: true,
                transactions: true
            }
        });

        if (!order) {
            return reply.status(404).send({ message: 'Pedido não encontrado ou link expirado.' });
        }

        return reply.send({
            id: order.id,
            totalValue: Number(order.totalValue),
            shippingValue: Number(order.shippingValue),
            discountValue: Number(order.discountValue),
            discountType: order.discountType,
            status: order.status,
            customer: order.customer,
            items: order.items,
            notes: order.notes,
            paymentLink: order.paymentLink,
            transactions: order.transactions,
            shippingType: order.shippingType
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

/**
 * Public Endpoint: Lookup customer by CPF
 * Returns customer data + addresses if found, so returning customers skip to confirmation.
 */
export const lookupByCpf = async (request: FastifyRequest<{ Querystring: { cpf: string } }>, reply: FastifyReply) => {
    const rawCpf = (request.query.cpf || '').replace(/\D/g, '');
    if (rawCpf.length < 11) {
        return reply.status(400).send({ message: 'CPF inválido' });
    }

    try {
        // Try to find by numeric CPF or formatted
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { cpf: rawCpf },
                    { cpf: rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') },
                ],
            },
            include: { addresses: true },
        });

        if (!customer) {
            return reply.status(404).send({ found: false });
        }

        return reply.send({
            found: true,
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                cpf: customer.cpf,
                rg: customer.rg,
                birthDate: customer.birthDate,
                addresses: customer.addresses,
            },
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

interface PaymentBody {
    amount: number;
    paymentMethod: 'PIX' | 'CARD' | 'BILLING';
    customerData?: {
        name: string;
        email: string;
        cpf: string;
        phone: string;
    };
}

/**
 * Public Endpoint: Process Payment
 * Método de pagamento não disponível no momento (AbacatePay removido).
 */
export const processPayment = async (request: FastifyRequest<{ Params: { id: string }, Body: PaymentBody }>, reply: FastifyReply) => {
    const { id } = request.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) return reply.status(404).send({ message: 'Pedido não encontrado' });
        if (order.status === 'PAID') return reply.status(400).send({ message: 'Pedido já foi pago' });

        return reply.status(501).send({ message: 'Método de pagamento não disponível no momento.' });
    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Falha no pagamento', details: error.message });
    }
};

// ─── Save Progress ──────────────────────────────────────────────────

interface SaveProgressBody {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    rg?: string;
    birthDate?: string;
    address?: {
        zip: string;
        street: string;
        number: string;
        neighborhood: string;
        city: string;
        state: string;
        complement?: string;
        type?: string;
    };
    notes?: string;
    partial?: boolean;
    deliveryMethod?: 'SHIP' | 'PICKUP';
    pickupLocation?: string;
    shippingValue?: number;
}

export const saveProgress = async (request: FastifyRequest<{ Params: { id: string }, Body: SaveProgressBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { name, email, phone, cpf, rg, birthDate, address, notes, deliveryMethod, pickupLocation, shippingValue } = request.body;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: { customer: true }
        });

        if (!order) return reply.status(404).send({ message: 'Order not found' });

        let customerFound = false;
        let targetCustomerId = order.customerId;
        const orderUpdateData: { shippingValue?: number } = {};

        // 1. Update Customer Data
        if (order.customerId) {
            if (cpf) {
                const existingCustomer = await prisma.customer.findUnique({ where: { cpf } });

                if (existingCustomer && existingCustomer.id !== order.customerId) {
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { customerId: existingCustomer.id }
                    });
                    targetCustomerId = existingCustomer.id;
                    customerFound = true;
                }
            }

            let birthDateObj: Date | undefined;
            if (birthDate && typeof birthDate === 'string') {
                if (birthDate.includes('/')) {
                    const [day, month, year] = birthDate.split('/');
                    birthDateObj = new Date(`${year}-${month}-${day}T12:00:00.000Z`); // Use midday to avoid timezone shift
                } else {
                    birthDateObj = new Date(`${birthDate.split('T')[0]}T12:00:00.000Z`);
                }
                if (birthDateObj && isNaN(birthDateObj.getTime())) {
                    birthDateObj = undefined;
                }
            }

            await prisma.customer.update({
                where: { id: targetCustomerId },
                data: {
                    name,
                    email,
                    phone,
                    cpf: customerFound ? undefined : cpf,
                    rg,
                    birthDate: birthDateObj
                }
            });

            order.customerId = targetCustomerId;
        }

        // 2. Shipping logic
        const LOCAL_CITIES = ['ALFENAS', 'MACHADO', 'POCOS DE CALDAS', 'POÇOS DE CALDAS'];
        let newShippingValue: number | undefined;
        const baseShipping = Number(order.originalShippingValue ?? order.shippingValue ?? 0);
        const isFreeShipping = order.shippingType === 'FREE';

        if (deliveryMethod === 'PICKUP') {
            newShippingValue = 0;
        } else if (isFreeShipping) {
            newShippingValue = 0;
        } else if (order.shippingType === 'DYNAMIC' && typeof request.body.shippingValue === 'number') {
            // Frontend calculated dynamic shipping
            newShippingValue = request.body.shippingValue;
        } else {
            newShippingValue = baseShipping;
            if (address && address.city) {
                const cleanCity = address.city.toUpperCase().trim();
                const isLocal = LOCAL_CITIES.some(c => cleanCity.includes(c));
                if (isLocal) {
                    newShippingValue = 7.00;
                }
            } else if (!address && deliveryMethod === 'SHIP') {
                newShippingValue = baseShipping;
            }
        }

        if (newShippingValue !== undefined) {
            orderUpdateData.shippingValue = newShippingValue;
        }

        // 3. Update Order
        if (Object.keys(orderUpdateData).length > 0) {
            await prisma.order.update({ where: { id }, data: orderUpdateData });
        }

        // 4. Update Address
        if (address && order.customerId) {
            if (address.zip) {
                await prisma.address.updateMany({
                    where: { customerId: order.customerId },
                    data: { isPrimary: false }
                });

                const existingAddress = await prisma.address.findFirst({
                    where: {
                        customerId: order.customerId,
                        zip: address.zip,
                        street: address.street,
                        number: address.number
                    }
                });

                if (existingAddress) {
                    await prisma.address.update({
                        where: { id: existingAddress.id },
                        data: {
                            isPrimary: true,
                            neighborhood: address.neighborhood,
                            complement: address.complement,
                            type: address.type || existingAddress.type
                        }
                    });
                } else {
                    await prisma.address.create({
                        data: {
                            customerId: order.customerId,
                            zip: address.zip,
                            street: address.street,
                            number: address.number,
                            neighborhood: address.neighborhood,
                            city: address.city,
                            state: address.state,
                            complement: address.complement,
                            type: address.type || 'HOME',
                            isPrimary: true
                        }
                    });
                }
            }
        }

        // 5. Order Notes
        if (notes && order.customerId) {
            await prisma.orderNote.create({
                data: {
                    orderId: order.id,
                    content: notes,
                    authorType: 'CUSTOMER',
                }
            });
        }

        // 6. Pickup location note
        if (deliveryMethod === 'PICKUP' && pickupLocation && order.customerId) {
            const systemNotePrefix = '[Sistema] Retirada na loja:';
            const existingPickupNote = await prisma.orderNote.findFirst({
                where: {
                    orderId: order.id,
                    authorType: 'ATTENDANT',
                    content: { contains: systemNotePrefix }
                }
            });

            if (!existingPickupNote) {
                await prisma.orderNote.create({
                    data: {
                        orderId: order.id,
                        content: `${systemNotePrefix} ${pickupLocation}`,
                        authorType: 'ATTENDANT',
                    }
                });
            }
        }

        return reply.send({ message: 'Progress saved', customerFound });

    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Save Failed', error: error.message });
    }
};

export const deleteCheckoutAddress = async (request: FastifyRequest<{ Params: { id: string, addressId: string } }>, reply: FastifyReply) => {
    return deleteCheckoutAddressService(request, reply);
};

export const uploadAttachment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return reply.status(501).send({ message: 'Not implemented in CheckoutController yet' });
};

/**
 * Public Endpoint: Get Shipping Quotes via Melhor Envio
 */
export const getShippingQuote = async (request: FastifyRequest<{ Querystring: { zip: string } }>, reply: FastifyReply) => {
    try {
        const { zip } = request.query;
        if (!zip || zip.length < 8) {
            return reply.status(400).send({ message: 'CEP inválido' });
        }

        const cleanZip = zip.replace(/\D/g, '');
        const quotes = await melhorEnvioService.calculateShipment({ toZipCode: cleanZip });

        return reply.send(quotes);
    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Erro ao calcular frete', error: error.message });
    }
};
