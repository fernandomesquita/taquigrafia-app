FROM node:20-slim

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies with npm
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build frontend
RUN npx vite build

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start server
CMD ["npx", "tsx", "server/_core/index.ts"]
