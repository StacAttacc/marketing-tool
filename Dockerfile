FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN ls -la && HUSKY=0 npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000
ENV NODE_ENV=production

# Run migrations before first deploy or after schema changes:
#   docker run --rm --env-file .env --entrypoint sh <builder-image> \
#     -c "node_modules/.bin/drizzle-kit migrate --config=drizzle.config.ts"

CMD ["node", ".output/server/index.mjs"]
