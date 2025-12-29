# Documentação do Sistema FarmaPay

## 🏛️ Arquitetura

O sistema segue uma arquitetura **Client-Server** tradicional (Monorepo lógico):

- **Frontend (SPA):** React consumindo API REST.
- **Backend (API):** Fastify expondo rotas REST e gerenciando regras de negócio.
- **Database:** PostgreSQL gerenciado pelo Prisma ORM (hospedado no Supabase).

## 🔐 Segurança

### Autenticação

- **JWT (JSON Web Tokens):** Utilizado para sessões de atendentes e clientes.
- **Proteção de Rotas:** Hooks `onRequest` com `jwtVerify` no Fastify.

### Banco de Dados

- **RLS (Row Level Security):** Ativado em todas as tabelas.
- **Policy:** Apenas a role `service_role` (Backend) tem permissão de escrita/leitura. Acesso público é bloqueado.

## 🔄 Fluxos Principais

### 1. Pedidos

- O atendente cria um pedido (`Order`) para um cliente.
- Adiciona itens (`OrderItem`).
- Gera link de pagamento (integração Asaas).

### 2. Clientes

- Cadastro completo com endereços múltiplos.
- **Sistema de Notas:** Histórico de observações com autoria (Atendente).

### 3. Webhooks (Asaas)

- O sistema recebe notificações de pagamento em `/asaas/webhook`.
- Atualiza o status do `Order` e cria `PaymentTransaction`.

## 📂 Estrutura de Pastas

### Backend

- `/src/controllers`: Lógica de cada rota.
- `/src/routes`: Definição de endpoints.
- `/prisma`: Schema do banco de dados.

### Frontend

- `/src/pages`: Telas da aplicação.
- `/src/components`: Componentes reutilizáveis (OrderTable, StatusFilter).
- `/src/lib`: Configurações (API axios).
