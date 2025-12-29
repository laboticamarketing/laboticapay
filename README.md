# La Botica Pay

Sistema de gestão de pedidos e pagamentos para farmácias de manipulação.

## Estrutura do Projeto

* **backend/**: API em Node.js com Fastify e Prisma.
* **frontend/**: Interface em React com Vite e TailwindCSS.

## 🚀 Como Subir no EasyPanel (Deploy)

Este projeto está pronto para deploy usando Docker. Ele possui dois serviços configurados com `Dockerfile` para facilitar o deploy.

### 1. Preparação

1. Suba este código para seu **GitHub** ou **GitLab** (certifique-se de que a pasta raiz contenha `backend/` e `frontend/`).
2. Tenha seu projeto **Supabase** (Banco de Dados) criado e copie a string de conexão.

### 2. Configurando o Backend (EasyPanel)

1. No EasyPanel, crie um novo **Service** do tipo **App**.
2. Dê o nome de `labotica-backend`.
3. **Source**: Conecte seu repositório GitHub e selecione a branch `main`.
4. **Build Path**: Defina como `/backend` (Importante: isso diz para o EasyPanel usar o Dockerfile que está dentro da pasta backend).
5. **Environment Variables**: Adicione as variáveis (copie do seu `.env` local):
    * `DATABASE_URL`: Sua string de conexão Supabase (Use a porta 6543 - Transaction Pooler, se possível).
    * `JWT_SECRET`: Uma chave secreta longa e segura.
    * `CORS_ORIGIN`: A URL que será do seu frontend (ex: `https://app.seudominio.com`).
    * `SUPABASE_URL`: URL do projeto Supabase.
    * `SUPABASE_KEY`: Chave `service_role` (para backend) ou `anon`.
    * `ASAAS_API_KEY`: Chave da API do Asaas.
    * `ASAAS_API_URL`: URL da API Asaas.
    * `PORT`: `4000` (Opcional, o Dockerfile já expõe a 4000).
6. **Deploy**: Clique em "Create" ou "Deploy".
7. Após o deploy, o EasyPanel vai gerar uma URL para o backend (ex: `https://labotica-backend.easypanel.host`). Copie essa URL.

### 3. Configurando o Frontend (EasyPanel)

1. Crie outro **Service** do tipo **App**.
2. Dê o nome de `labotica-frontend`.
3. **Source**: Mesmo repositório.
4. **Build Path**: Defina como `/frontend`.
5. **Environment Variables**:
    * `VITE_API_URL`: A URL do backend que você copiou no passo anterior (ex: `https://labotica-backend.easypanel.host`). **Atenção:** Sem a barra `/` no final.
6. **Domains**: Configure seu domínio customizado (ex: `app.seudominio.com`) ou use o gratuito do EasyPanel.
7. **Deploy**: Clique em "Create" ou "Deploy".

---

## 👤 Gerenciando Usuários (Criar Login)

O sistema não possui tela de cadastro público. Você deve criar o primeiro usuário admin manualmente.

### Opção A: Via Console do EasyPanel (Recomendado)

1. No EasyPanel, clique no serviço **labotica-backend**.
2. Vá na aba **Console**.
3. Execute o comando para criar um usuário:

    ```bash
    npx ts-node scripts/create-user.ts seu@email.com sua_senha "Seu Nome" ADMIN
    ```

    *(Aguarde o comando finalizar. Se der sucesso, ele mostrará o ID do usuário criado)*.

### Opção B: Via Banco de Dados (Supabase)

Vá no SQL Editor do Supabase e rode:

```sql
INSERT INTO "Profile" (id, email, password_hash, name, role, "tokenVersion", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'seu@email.com',
  'HASH_BCRYPT_DA_SENHA', -- Gere um hash da senha em algum site "Bcrypt Generator"
  'Seu Nome',
  'ADMIN',
  0,
  now(),
  now()
);
```

## Configuração Local (Desenvolvimento)

### Backend

1. `cd backend`
2. `npm install`
3. `npx prisma generate`
4. `npm run dev`

### Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`
