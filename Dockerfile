FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

FROM base AS dependencies

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install all dependencies
RUN pnpm install --frozen-lockfile

FROM base AS build

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build
RUN pnpm run build

FROM base AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=build /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
