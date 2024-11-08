# syntax = docker/dockerfile:1
FROM node:20.13-slim AS base
LABEL fly_launch_runtime="Remix/Prisma"
WORKDIR /app
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
RUN corepack enable pnpm

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
COPY --from=build /app/dist /app/dist
COPY --from=build /app/prisma /app/prisma
COPY --from=build /app/package.json /app/

EXPOSE 3000
CMD [ "node", "./dist/server.js" ]
