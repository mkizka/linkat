# syntax = docker/dockerfile:1
FROM node:22.14-slim AS base
WORKDIR /app
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
RUN npm i -g corepack@latest && \
    corepack enable pnpm

FROM base AS build
COPY --link package.json pnpm-lock.yaml ./
COPY --link scripts ./scripts
COPY --link prisma ./prisma
COPY --link lexicons ./lexicons
RUN pnpm install --frozen-lockfile
COPY --link . .
ARG VITE_CONFIG_BASE=/
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

FROM base AS runner
ENV NODE_ENV="production"
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
COPY --from=build /app/fonts /app/fonts
COPY --from=build /app/dist /app/dist
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/package.json /app/

EXPOSE 3000
CMD [ "node", "./dist/server.js" ]
