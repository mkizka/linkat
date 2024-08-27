FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY lexicons ./lexicons
COPY scripts ./scripts
RUN pnpm i --frozen-lockfile

FROM deps AS deps-prod
RUN pnpm prune --prod --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/app/generated ./app/generated
COPY --from=deps /app/app/.server/generated ./app/.server/generated
COPY . .
RUN pnpm build && pnpm prisma db push --skip-generate

FROM base AS runner
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

CMD ["node", "dist/server.js"]
