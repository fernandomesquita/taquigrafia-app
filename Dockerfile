FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install ALL dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

# Run with node
CMD ["node", "dist/index.js"]
