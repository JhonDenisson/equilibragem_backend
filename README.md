# Equilibragem Backend - Contexto do Projeto

## Visão Geral

API de controle financeiro pessoal construída com **Bun**, **Elysia** e **Drizzle ORM**.

## Stack Tecnológica

- **Runtime**: Bun
- **Framework**: Elysia (web framework)
- **ORM**: Drizzle ORM
- **Banco de dados**: PostgreSQL
- **Validação**: Zod
- **Autenticação**: JWT (@elysiajs/jwt)
- **Formatação**: Biome

## Estrutura do Projeto

```
src/
├── index.ts                    # Ponto de entrada da aplicação
├── db/
│   ├── index.ts                # Configuração do Drizzle/Postgres
│   └── schema.ts               # Schema do banco de dados
├── modules/                    # Módulos da aplicação (feature-based)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts
│   ├── categories/
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── categories.schema.ts
│   └── transactions/
│       ├── transactions.controller.ts
│       ├── transactions.service.ts
│       └── transactions.schema.ts
└── shared/                     # Código compartilhado
    ├── auth/
    │   └── index.ts            # Helper de autenticação JWT
    ├── middlewares/
    │   └── logger.ts
    └── utils/
```

## Padrão de Módulos

Cada módulo segue a estrutura:

### 1. Schema (`*.schema.ts`)
- Validação com Zod
- Schemas de criação, atualização e query
- Exporta DTOs tipados

```typescript
import { z } from "zod";

export const createEntitySchema = z.object({
  // campos obrigatórios
});

export const updateEntitySchema = z.object({
  // campos opcionais
});

export type CreateEntityDTO = z.infer<typeof createEntitySchema>;
export type UpdateEntityDTO = z.infer<typeof updateEntitySchema>;
```

### 2. Service (`*.service.ts`)
- Lógica de negócio e acesso ao banco
- Métodos CRUD padrão
- Sempre filtra por `userId` para isolamento de dados

```typescript
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { entities } from "../../db/schema";
import type { NewEntity } from "../../db/schema";

export class EntityService {
  async findById(id: number, userId: number) { ... }
  async findAllByUser(userId: number) { ... }
  async create(data: NewEntity) { ... }
  async update(id: number, userId: number, data: Partial<...>) { ... }
  async delete(id: number, userId: number) { ... }
}
```

### 3. Controller (`*.controller.ts`)
- Rotas HTTP com Elysia
- Autenticação via `requireAuth`
- Validação de body com Zod

```typescript
import { Elysia } from "elysia";
import { EntityService } from "./entity.service";
import { createEntitySchema, updateEntitySchema } from "./entity.schema";
import { jwtConfig, isAuthError, requireAuth } from "../../shared/auth";

const entityService = new EntityService();

export const entityController = new Elysia({ prefix: "/entities" })
  .use(jwtConfig)
  .get("/", async ({ jwt, headers, set }) => {
    const result = await requireAuth(headers.authorization, jwt, set);
    if (isAuthError(result)) return result;

    return await entityService.findAllByUser(result.id);
  })
  // ... outras rotas
```
