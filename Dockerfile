FROM node:20-slim

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copiar package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY patches patches

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build frontend
RUN pnpm exec vite build

# Set env
ENV NODE_ENV=production

# Start with tsx
CMD ["pnpm", "exec", "tsx", "server/_core/index.ts"]
