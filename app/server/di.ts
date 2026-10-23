import { createRegistry } from "@gyaku/di";

import { atpassportClientFactory } from "~/server/infrastructure/auth/atpassportClient";
import { cookieSessionStorageFactory } from "~/server/infrastructure/auth/cookieSessionStorage";
import { oauthClientFactory } from "~/server/infrastructure/auth/oauthClient";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "~/server/infrastructure/auth/oauthStorage";
import { boardPdsRepositoryFactory } from "~/server/infrastructure/board/boardPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/board/boardRepository";
import { bskyLinkPdsRepositoryFactory } from "~/server/infrastructure/bskyLink/bskyLinkPdsRepository";
import { db } from "~/server/infrastructure/db/drizzle";
import { faviconFetcherFactory } from "~/server/infrastructure/favicon/faviconFetcher";
import { icoConverterFactory } from "~/server/infrastructure/favicon/icoConverter";
import { cursorRepositoryFactory } from "~/server/infrastructure/ingester/cursorRepository";
import { ingesterClientFactory } from "~/server/infrastructure/ingester/ingesterClient";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import { metricsFactory } from "~/server/infrastructure/metrics/metrics";
import { moderationRepositoryFactory } from "~/server/infrastructure/moderation/moderationRepository";
import { handleIndexFactory } from "~/server/infrastructure/owner/handleIndex";
import { identityResolverFactory } from "~/server/infrastructure/owner/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/owner/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/owner/profileRecordParser";
import { recentOwnersQueryFactory } from "~/server/infrastructure/query/recentOwnersQuery";
import { atpassportServiceFactory } from "~/server/service/auth/atpassport";
import { authServiceFactory } from "~/server/service/auth/auth";
import { sessionServiceFactory } from "~/server/service/auth/session";
import { boardServiceFactory } from "~/server/service/board/board";
import { boardEventServiceFactory } from "~/server/service/board/boardEvent";
import { bskyLinkServiceFactory } from "~/server/service/bskyLink/bskyLink";
import { ingesterServiceFactory } from "~/server/service/ingester/ingester";
import { moderationServiceFactory } from "~/server/service/moderation/moderation";
import { ownerServiceFactory } from "~/server/service/owner/owner";
import { ownerViewServiceFactory } from "~/server/service/owner/ownerView";
import { env } from "~/utils/env";

export const di = await createRegistry()
  .value("db", db)
  .value("adminDids", env.ADMIN_DIDS)
  .service("logger", loggerFactory)
  .service("metrics", metricsFactory)
  .service("boardRepository", ["db"], boardRepositoryFactory)
  .service("cursorRepository", ["db"], cursorRepositoryFactory)
  .service("ownerRepository", ["db"], ownerRepositoryFactory)
  .service("recentOwnersQuery", ["db"], recentOwnersQueryFactory)
  .service("handleIndex", ["db"], handleIndexFactory)
  .service("moderationRepository", ["db"], moderationRepositoryFactory)
  .service("oauthStateStore", ["db"], stateStoreFactory)
  .service("oauthSessionStore", ["db"], sessionStoreFactory)
  .service("identityResolver", ["logger"], identityResolverFactory)
  .service("profileRecordParser", profileRecordParserFactory)
  .service(
    "oauthClient",
    ["oauthStateStore", "oauthSessionStore"],
    oauthClientFactory,
  )
  .service("boardPdsRepository", ["oauthClient"], boardPdsRepositoryFactory)
  .service(
    "bskyLinkPdsRepository",
    ["oauthClient"],
    bskyLinkPdsRepositoryFactory,
  )
  .service("icoConverter", icoConverterFactory)
  .service("faviconFetcher", ["icoConverter", "logger"], faviconFetcherFactory)
  .service(
    "profileFetcher",
    ["profileRecordParser", "logger"],
    profileFetcherFactory,
  )
  .service("atpassportClient", atpassportClientFactory)
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service("ownerViewService", ownerViewServiceFactory)
  .service(
    "ownerService",
    [
      "ownerRepository",
      "profileFetcher",
      "identityResolver",
      "ownerViewService",
    ],
    ownerServiceFactory,
  )
  .service("moderationService", ["adminDids"], moderationServiceFactory)
  .service(
    "boardService",
    [
      "boardRepository",
      "handleIndex",
      "ownerRepository",
      "ownerViewService",
      "recentOwnersQuery",
      "moderationRepository",
      "moderationService",
    ],
    boardServiceFactory,
  )
  .service(
    "boardEventService",
    ["boardRepository", "boardPdsRepository", "ownerService"],
    boardEventServiceFactory,
  )
  .service(
    "bskyLinkService",
    ["boardRepository", "bskyLinkPdsRepository", "faviconFetcher"],
    bskyLinkServiceFactory,
  )
  .service("atpassportService", ["atpassportClient"], atpassportServiceFactory)
  .service("authService", ["oauthClient"], authServiceFactory)
  .service(
    "sessionService",
    ["cookieSessionStorage", "oauthClient", "logger"],
    sessionServiceFactory,
  )
  .service(
    "ingesterService",
    ["boardEventService", "ownerService", "profileRecordParser", "logger"],
    ingesterServiceFactory,
  )
  .service(
    "ingesterClient",
    ["ingesterService", "cursorRepository", "logger", "metrics"],
    ingesterClientFactory,
  )
  .resolve();
