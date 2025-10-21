FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Configure pnpm to not use symlinks
RUN pnpm config set node-linker hoisted

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install with hoisted node-linker
RUN pnpm install --frozen-lockfile --shamefully-hoist

COPY . .

# Build frontend only
RUN pnpm exec vite build

ENV NODE_ENV=production
EXPOSE 3000

# Run with tsx
CMD ["pnpm", "exec", "tsx", "server/_core/index.ts"]
