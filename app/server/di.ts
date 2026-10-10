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
import { db } from "~/server/infrastructure/db/drizzle";
import { cursorRepositoryFactory } from "~/server/infrastructure/ingester/cursorRepository";
import { ingesterClientFactory } from "~/server/infrastructure/ingester/ingesterClient";
import { loggerFactory } from "~/server/infrastructure/logger/logger";
import { metricsFactory } from "~/server/infrastructure/metrics/metrics";
import { handleIndexFactory } from "~/server/infrastructure/owner/handleIndex";
import { identityResolverFactory } from "~/server/infrastructure/owner/identityResolver";
import { ownerRepositoryFactory } from "~/server/infrastructure/owner/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/owner/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/owner/profileRecordParser";
import { atpassportServiceFactory } from "~/server/service/auth/atpassport";
import { authServiceFactory } from "~/server/service/auth/auth";
import { sessionServiceFactory } from "~/server/service/auth/session";
import { boardServiceFactory } from "~/server/service/board/board";
import { boardEventServiceFactory } from "~/server/service/board/boardEvent";
import { ingesterServiceFactory } from "~/server/service/ingester/ingester";
import { ownerServiceFactory } from "~/server/service/owner/owner";

export const di = await createRegistry()
  .value("db", db)
  .service("logger", loggerFactory)
  .service("metrics", metricsFactory)
  .service("boardRepository", ["db"], boardRepositoryFactory)
  .service("cursorRepository", ["db"], cursorRepositoryFactory)
  .service("ownerRepository", ["db"], ownerRepositoryFactory)
  .service("handleIndex", ["db"], handleIndexFactory)
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
    "profileFetcher",
    ["profileRecordParser", "logger"],
    profileFetcherFactory,
  )
  .service("atpassportClient", atpassportClientFactory)
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service(
    "ownerService",
    ["ownerRepository", "profileFetcher", "identityResolver"],
    ownerServiceFactory,
  )
  .service(
    "boardService",
    ["boardRepository", "handleIndex", "ownerService"],
    boardServiceFactory,
  )
  .service(
    "boardEventService",
    [
      "boardRepository",
      "boardPdsRepository",
      "ownerRepository",
      "ownerService",
    ],
    boardEventServiceFactory,
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
    ["cursorRepository", "logger", "metrics"],
    ingesterClientFactory,
  )
  .resolve();
