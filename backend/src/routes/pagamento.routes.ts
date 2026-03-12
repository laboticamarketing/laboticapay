import { FastifyInstance } from 'fastify';
import * as pagamentoController from '../controllers/pagamento.controller';

export async function pagamentoRoutes(fastify: FastifyInstance) {
    // Rotas públicas - sem JWT (checkout pode ser anônimo)
    fastify.post('/criar', pagamentoController.criar);
    fastify.post('/cancelar', pagamentoController.cancelar);
    fastify.get('/consultar/:tid', pagamentoController.consultar);
    // PIX
    fastify.post('/pix/criar', pagamentoController.criarPix);
    fastify.get('/pix/consultar/:tid', pagamentoController.consultarPix);
}
