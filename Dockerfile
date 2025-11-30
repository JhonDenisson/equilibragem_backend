FROM oven/bun:1 AS base
WORKDIR /app

# Instalar dependências (incluindo devDependencies para drizzle-kit)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

# Expor porta
EXPOSE 3000

# Comando de inicialização: roda migrations e depois inicia o servidor
CMD ["sh", "-c", "bun run db:migrate && bun run src/index.ts"]