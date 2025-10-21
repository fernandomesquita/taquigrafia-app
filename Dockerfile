FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@10.4.1

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile --prod=false

COPY . .

RUN pnpm run build

ENV NODE_ENV=production

CMD ["node", "--experimental-modules", "dist/index.js"]
