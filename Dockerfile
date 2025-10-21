FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

# Build apenas o frontend (Vite)
RUN pnpm exec vite build

ENV NODE_ENV=production
EXPOSE 3000

# Executar backend com tsx (sem build)
CMD ["pnpm", "start"]
