FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Instalar TODAS as dependências (incluindo devDependencies para ter tsx)
RUN pnpm install --frozen-lockfile

COPY . .

# Build apenas do frontend (Vite)
RUN pnpm exec vite build

ENV NODE_ENV=production

# Executar backend com tsx (sem build do esbuild)
CMD ["pnpm", "exec", "tsx", "server/_core/index.ts"]
