FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npx vite build

ENV NODE_ENV=production

CMD ["npx", "tsx", "server/_core/index.ts"]
