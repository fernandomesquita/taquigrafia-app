FROM node:20-slim

WORKDIR /app

# Copy package.json
COPY package.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
RUN npx vite build

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Run migrations and start server
CMD npx drizzle-kit push && npx tsx server/_core/index.ts
