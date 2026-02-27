import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma';

type DeleteCheckoutAddressRequest = FastifyRequest<{
    Params: { id: string; addressId: string };
}>;

export const deleteCheckoutAddressService = async (
    request: DeleteCheckoutAddressRequest,
    reply: FastifyReply
) => {
    const { id, addressId } = request.params;

    try {
        const order = await prisma.order.findUnique({
            where: { id },
            select: { customerId: true, addressId: true, status: true }
        });

        if (!order) {
            return reply.status(404).send({ error: 'Order not found' });
        }

        if (order.status !== 'PENDING') {
            return reply.status(400).send({ error: 'Cannot delete address from processed order' });
        }

        const address = await prisma.address.findFirst({
            where: { id: addressId, customerId: order.customerId }
        });

        if (!address) {
            return reply.status(404).send({ error: 'Address not found for this customer' });
        }

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

