# Estratégia de Tipos Compartilhados

## 📋 Situação Atual

Atualmente, os tipos são definidos separadamente no frontend e backend, causando duplicação e possível dessincronização.

### Backend

- Tipos gerados pelo Prisma (em `@prisma/client`)
- Interfaces em controllers/services (TypeScript)

### Frontend

- `frontend/src/types/order.types.ts`
- `frontend/src/types/customer.types.ts`
- `frontend/types.ts` (na raiz - duplicado)

## 🎯 Estratégias Recomendadas

### Opção 1: Package de Tipos Compartilhados (Recomendado para monorepo)

Criar um package separado com tipos compartilhados:

```
packages/
  shared-types/
    package.json
    src/
      order.ts
      customer.ts
      index.ts
```

**Prós**:

- Types podem ser importados em ambos os projetos
- Fonte única de verdade
- Facilita manutenção

**Contras**:

- Requer setup de monorepo (Turborepo, Nx, Lerna)
- Mais complexo de configurar

### Opção 2: Gerar Tipos do Backend para Frontend

Usar ferramentas como `openapi-typescript` ou `graphql-codegen` para gerar tipos do backend.

**Prós**:

- Tipos sempre sincronizados com API
- Automático

**Contras**:

- Requer documentação OpenAPI/Swagger
- Tipos podem ser muito verbosos

### Opção 3: Manter Separado com Documentação (Atual - MVP)

Manter tipos separados mas documentar convenções e manter sincronizados manualmente.

**Prós**:

- Simples, sem overhead
- Bom para MVP

**Contras**:

- Pode dessincronizar
- Requer disciplina manual

## ✅ Recomendação para o Projeto

**Para MVP/Curto Prazo**: Opção 3 (manter separado)

**Para Longo Prazo**: Migrar para Opção 1 ou 2 quando o projeto crescer.

## 📝 Convenções a Seguir

1. **Nomenclatura**: Usar os mesmos nomes de campos entre frontend e backend
2. **Documentação**: Documentar mudanças de tipos na API
3. **Validação**: Usar Zod no backend para garantir tipos corretos
4. **Revisão**: Revisar tipos ao fazer mudanças na API

## 🔄 Ações Imediatas

1. ✅ Consolidar tipos duplicados no frontend (Removido `types.ts`, centralizado em `src/types/`)
2. ✅ Documentar convenções
3. ⏳ Considerar gerar tipos do Prisma para o frontend (futuro)
4. ⏳ Avaliar monorepo quando projeto crescer
