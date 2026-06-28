FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN HUSKY=0 npm install

COPY . .
RUN npm run build

FROM builder AS migrator
ENV NODE_ENV=production
CMD ["npx", "drizzle-kit", "migrate", "--config=drizzle.config.ts"]

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
