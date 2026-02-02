import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';
import { maxiPagoService } from '../services/maxipago.service';

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

        // Return safe public data
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
            paymentLink: order.paymentLink, // Might contain status
            transactions: order.transactions
        });
    } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Internal Server Error' });
    }
};

interface PaymentBody {
    amount: number; // Frontend confirmation of amount
    paymentMethod: 'CREDIT_CARD' | 'PIX';
    cardData?: {
        number: string;
        holderName: string;
        month: string;
        year: string;
        cvv: string;
        installments: number;
    };
    customerData?: { // For updating missing fields if needed
        name: string;
        email: string;
        cpf: string;
    };
}

/**
 * Public Endpoint: Process Payment (Transparent)
 */
export const processPayment = async (request: FastifyRequest<{ Params: { id: string }, Body: PaymentBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { paymentMethod, cardData } = request.body;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: {
                    include: { addresses: true }
                }
            }
        });

        if (!order) return reply.status(404).send({ message: 'Order not found' });
        if (order.status === 'PAID') return reply.status(400).send({ message: 'Order already paid' });

        // Calculate Final Amount
        let finalAmount = Number(order.totalValue) + Number(order.shippingValue || 0);
        if (order.discountValue) {
            if (order.discountType === 'PERCENTAGE') {
                finalAmount -= (Number(order.totalValue) * Number(order.discountValue) / 100);
            } else {
                finalAmount -= Number(order.discountValue);
            }
        }

        // Generate unique reference (Short ID + Timestamp) to avoid duplicates and length limits
        const reference = `${order.id.split('-').pop()}-${Date.now()}`;

        // Prepare Customer Data (required for Pix)
        const billingAddress = order.customer?.addresses?.find(a => a.isPrimary) || order.customer?.addresses?.[0];

        const customerData = order.customer ? {
            name: order.customer.name,
            email: order.customer.email || '',
            phone: order.customer.phone,
            cpf: order.customer.cpf || '',
            address: billingAddress?.street || '',
            number: billingAddress?.number || '',
            city: billingAddress?.city || '',
            state: billingAddress?.state || '',
            postalcode: billingAddress?.zip || '',
        } : undefined;

        let result;

        if (paymentMethod === 'PIX') {
            // Force integer amount for Sandbox compatibility (avoids fractional cent declines)
            const amountInCents = Math.ceil(finalAmount) * 100;

            result = await maxiPagoService.createPixTransaction({
                reference,
                amountInCents,
                customer: customerData
            });

        } else if (paymentMethod === 'CREDIT_CARD') {
            if (!cardData) return reply.status(400).send({ message: 'Card data required' });

            result = await maxiPagoService.createCreditCardTransaction(
                reference,
                Math.round(finalAmount * 100),
                {
                    cardNumber: cardData.number,
                    holderName: cardData.holderName,
                    expirationMonth: cardData.month,
                    expirationYear: cardData.year,
                    securityCode: cardData.cvv,
                    installments: cardData.installments
                },
                customerData
            );
        } else {
            return reply.status(400).send({ message: 'Invalid method' });
        }

        // Handle Result Status
        if (result.success) {
            if (paymentMethod === 'CREDIT_CARD') {
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'PAID' }
                });
            }

            // Save Transaction Record
            await prisma.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    gatewayId: result.txId || `manual-${Date.now()}`,
                    type: paymentMethod,
                    status: paymentMethod === 'CREDIT_CARD' ? 'CONFIRMED' : 'PENDING',
                    amount: finalAmount,
                    metadata: paymentMethod === 'CREDIT_CARD' && cardData ? {
                        brand: 'Credit Card', // Ideally detect brand, but generic ok for now
                        last4: cardData.number.slice(-4),
                        installments: cardData.installments
                    } : {
                        pixKey: result.qrcodeText
                    }
                }
            });

            // For Pix, we might wait for webhook
        }

        return reply.send(result);

    } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({ message: 'Payment Failed', details: error.response?.data || error.message });
    }
};

/**
 * Existing Address/Attachment helpers
 */
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
}

/**
 * Public Endpoint: Save Order Progress (Partial Update)
 */
export const saveProgress = async (request: FastifyRequest<{ Params: { id: string }, Body: SaveProgressBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { name, email, phone, cpf, rg, birthDate, address, notes, deliveryMethod, pickupLocation } = request.body;

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
            // Check for CPF conflict
            if (cpf) {
                const existingCustomer = await prisma.customer.findUnique({
                    where: { cpf }
                });

                if (existingCustomer && existingCustomer.id !== order.customerId) {
                    // CPF belongs to another customer. Switch order to this customer.
                    await prisma.order.update({
                        where: { id: order.id },
                        data: { customerId: existingCustomer.id }
                    });
                    targetCustomerId = existingCustomer.id;
                    customerFound = true; // Signal frontend to skip steps
                }
            }

            let birthDateObj: Date | undefined;
            if (birthDate && typeof birthDate === 'string') {
                if (birthDate.includes('/')) {
                    const [day, month, year] = birthDate.split('/');
                    birthDateObj = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
                } else {
                    birthDateObj = new Date(birthDate);
                }

                // Validate Date
                if (birthDateObj && isNaN(birthDateObj.getTime())) {
                    birthDateObj = undefined; // Skip update if invalid
                }
            }

            // Update customer
            await prisma.customer.update({
                where: { id: targetCustomerId },
                data: {
                    name,
                    email,
                    phone,
                    // If we found a match (customerFound is true), we don't need to update CPF as it's already correct on the target.
                    cpf: customerFound ? undefined : cpf,
                    rg,
                    birthDate: birthDateObj
                }
            });

            // Update local ref for subsequent steps (address/notes)
            order.customerId = targetCustomerId;
        }

        // 2. Update Shipping Value based on delivery method and address rules
        const LOCAL_CITIES = ['ALFENAS', 'MACHADO', 'POCOS DE CALDAS', 'POÇOS DE CALDAS'];
        let newShippingValue: number | undefined;

        // Base shipping value from original link config (fallback to current if not set - legacy support)
        // If originalShippingValue is null, we assume the initial value was the correct base.
        const baseShipping = Number(order.originalShippingValue ?? order.shippingValue ?? 0);
        const isFreeShipping = order.shippingType === 'FREE';

        if (deliveryMethod === 'PICKUP') {
            newShippingValue = 0;
        } else if (isFreeShipping) {
            newShippingValue = 0;
        } else {
            // Default to base (link value) when shipping (or when method not specified but address updated)
            newShippingValue = baseShipping;

            // Check local delivery exception if address is available (either from this request or existing)
            // We use the 'address' from body if present, otherwise we'd need to fetch existing address associated with order? 
            // The 'address' in body is partial update. 
            // Note: 'saveProgress' body has 'address'.

            if (address && address.city) {
                const cleanCity = address.city.toUpperCase().trim();
                const isLocal = LOCAL_CITIES.some(c => cleanCity.includes(c));
                if (isLocal) {
                    newShippingValue = 7.00;
                }
            } else if (!address && deliveryMethod === 'SHIP') {
                // If switching to SHIP but no address provided in this request, we should technically check existing address.
                // But typically frontend sends address with the switch.
                // For now, if no address in body, we revert to base.
                newShippingValue = baseShipping;
            }
        }

        if (newShippingValue !== undefined) {
            orderUpdateData.shippingValue = newShippingValue;
        }

        // 3. Update Order with potential new shipping value
        if (Object.keys(orderUpdateData).length > 0) {
            await prisma.order.update({
                where: { id },
                data: orderUpdateData
            });
        }

        // 4. Update Address (if provided)
        if (address && order.customerId) {
            // Check if address exists or create new
            if (address.zip) {
                // 1. Unset any existing primary address for this customer
                await prisma.address.updateMany({
                    where: { customerId: order.customerId },
                    data: { isPrimary: false }
                });

                // 2. Check if this exact address already exists
                const existingAddress = await prisma.address.findFirst({
                    where: {
                        customerId: order.customerId,
                        zip: address.zip,
                        street: address.street,
                        number: address.number
                    }
                });

                if (existingAddress) {
                    // Reuse and set as primary
                    await prisma.address.update({
                        where: { id: existingAddress.id },
                        data: {
                            isPrimary: true,
                            // Update details just in case
                            neighborhood: address.neighborhood,
                            complement: address.complement,
                            type: address.type || existingAddress.type
                        }
                    });
                } else {
                    // Create new
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

        // 5. Update Order Notes
        if (notes && order.customerId) {
            await prisma.orderNote.create({
                data: {
                    orderId: order.id,
                    content: notes,
                    authorType: 'CUSTOMER',
                    // authorId: order.customerId // REMOVED: Cannot link Customer ID to Profile FK
                }
            });
        }

        // 6. Add system note for pickup location if applicable
        if (deliveryMethod === 'PICKUP' && pickupLocation && order.customerId) {
            const systemNotePrefix = '[Sistema] Retirada na loja:';
            // Check if a similar note already exists
            const existingPickupNote = await prisma.orderNote.findFirst({
                where: {
                    orderId: order.id,
                    authorType: 'ATTENDANT', // Use ATTENDANT as fallback for system
                    content: { contains: systemNotePrefix }
                }
            });

            if (!existingPickupNote) {
                await prisma.orderNote.create({
                    data: {
                        orderId: order.id,
                        content: `${systemNotePrefix} ${pickupLocation}`,
                        authorType: 'ATTENDANT',
                        // authorId: null // System action, no specific attendant
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
    const { addressId } = request.params;
    try {
        await prisma.address.delete({ where: { id: addressId } });
        return reply.send({ message: 'Address deleted' });
    } catch (error) {
        return reply.status(500).send({ message: 'Delete Failed' });
    }
};

export const uploadAttachment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    return reply.status(501).send({ message: 'Not implemented in CheckoutController yet' });
};
