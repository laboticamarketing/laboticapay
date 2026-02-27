import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { abacatePayService } from '../services/abacatepay.service';
import { melhorEnvioService } from '../services/melhorenvio.service';
import { config } from '../config/env';
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
 * Public Endpoint: Process Payment via AbacatePay
 * 
 * Strategy: Creates an AbacatePay billing (link de pagamento) with the selected methods.
 * The AbacatePay hosted checkout handles card capture securely.
 * For PIX-only, we can also generate a direct QR Code.
 */
export const processPayment = async (request: FastifyRequest<{ Params: { id: string }, Body: PaymentBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { paymentMethod, customerData } = request.body;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    include: { addresses: true }
                },
                items: true
            }
        });

        if (!order) return reply.status(404).send({ message: 'Pedido não encontrado' });
        if (order.status === 'PAID') return reply.status(400).send({ message: 'Pedido já foi pago' });

        // Calculate final amount
        let finalAmount = Number(order.totalValue) + Number(order.shippingValue || 0);
        if (order.discountValue) {
            if (order.discountType === 'PERCENTAGE') {
                finalAmount -= (Number(order.totalValue) * Number(order.discountValue) / 100);
            } else {
                finalAmount -= Number(order.discountValue);
            }
        }

        // Amount in cents (AbacatePay uses centavos)
        const amountInCents = Math.round(finalAmount * 100);

        // Prepare base customer data (do nosso sistema)
        const customer = order.customer;
        const baseCustomer = customerData
            ? {
                name: customerData.name,
                email: (customerData.email || '').trim(),
                phone: customerData.phone,
                cpf: customerData.cpf,
            }
            : customer
                ? {
                    name: customer.name,
                    email: (customer.email || '').trim(),
                    phone: customer.phone,
                    cpf: customer.cpf || '',
                }
                : null;

        // Helper de validação simples de e-mail
        const isValidEmail = (email: string | null | undefined) => {
            if (!email) return false;
            const trimmed = email.trim();
            return /\S+@\S+\.\S+/.test(trimmed);
        };

        // Para PIX, o cliente é opcional. Só enviamos se tiver e-mail válido.
        const pixCustomer = baseCustomer && isValidEmail(baseCustomer.email)
            ? {
                name: baseCustomer.name,
                email: baseCustomer.email,
                cellphone: baseCustomer.phone,
                taxId: baseCustomer.cpf || '',
            }
            : undefined;

        // Build products array from order items
        const products = order.items.map(item => ({
            externalId: item.id,
            name: item.name,
            description: item.dosage || '',
            quantity: 1,
            price: item.price ? Math.round(Number(item.price) * 100) : amountInCents,
        }));

        // If items don't have individual prices, use a single product entry
        const hasItemPrices = order.items.some(item => item.price);
        const finalProducts = hasItemPrices ? products : [{
            externalId: order.id,
            name: `Pedido #${order.id.slice(-6)}`,
            description: `${order.items.length} item(s)`,
            quantity: 1,
            price: amountInCents,
        }];

        // Determine base URL for redirects
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (paymentMethod === 'PIX') {
            // Direct PIX QR Code generation
            const result = await abacatePayService.createPixQrCode({
                amount: amountInCents,
                expiresIn: 3600,
                description: `Pedido La Botica #${order.id.slice(-6)}`,
                customer: pixCustomer,
                metadata: { orderId: order.id },
            });

            if (result.success) {
                await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        gatewayId: result.pixId || `pix-${Date.now()}`,
                        type: 'PIX',
                        status: 'PENDING',
                        amount: finalAmount,
                        metadata: {
                            pixId: result.pixId,
                            qrCode: result.qrCode,
                        }
                    }
                });
            }

            return reply.send(result);

        } else if (paymentMethod === 'CARD' || paymentMethod === 'BILLING') {
            // Create AbacatePay billing (hosted checkout)
            const methods: ('PIX' | 'CARD')[] = paymentMethod === 'CARD' ? ['CARD'] : ['PIX', 'CARD'];

            // Para cobrança (CARD/BILLING), a AbacatePay exige um customer.
            // Se não houver e-mail válido, geramos um e-mail técnico para cumprir a validação.
            const fallbackEmailDomain = 'laboticamanipulacao.com';
            const emailForBilling = baseCustomer && isValidEmail(baseCustomer.email)
                ? baseCustomer.email
                : `no-reply+${order.id}@${fallbackEmailDomain}`;

            const billingCustomer = baseCustomer
                ? {
                    name: baseCustomer.name,
                    email: emailForBilling,
                    cellphone: baseCustomer.phone,
                    taxId: baseCustomer.cpf || '',
                }
                : {
                    name: 'Cliente Checkout',
                    email: emailForBilling,
                    cellphone: customerData?.phone || customer?.phone || '00000000000',
                    taxId: customerData?.cpf || customer?.cpf || '',
                };

            const result = await abacatePayService.createBilling({
                frequency: 'ONE_TIME',
                methods,
                products: finalProducts,
                returnUrl: `${frontendUrl}/checkout/${order.id}`,
                completionUrl: `${frontendUrl}/checkout/${order.id}/success`,
                customer: billingCustomer,
                externalId: order.id,
                metadata: { orderId: order.id },
            });

            if (result.success) {
                // Update PaymentLink record
                await prisma.paymentLink.upsert({
                    where: { orderId: order.id },
                    update: {
                        asaasPaymentId: result.billingId,
                        asaasUrl: result.billingUrl,
                        status: result.status || 'PENDING',
                    },
                    create: {
                        orderId: order.id,
                        asaasPaymentId: result.billingId,
                        asaasUrl: result.billingUrl,
                        status: result.status || 'PENDING',
                    }
                });

                await prisma.paymentTransaction.create({
                    data: {
                        orderId: order.id,
                        gatewayId: result.billingId || `billing-${Date.now()}`,
                        type: paymentMethod,
                        status: 'PENDING',
                        amount: finalAmount,
                        metadata: {
                            billingId: result.billingId,
                            billingUrl: result.billingUrl,
                        }
                    }
                });
            }

            return reply.send(result);

        } else {
            return reply.status(400).send({ message: 'Método de pagamento inválido' });
        }
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
