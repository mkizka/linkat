import { createRegistry } from "@gyaku/di";

import { atpassportClientFactory } from "~/server/infrastructure/atpassportClient";
import { boardPdsRepositoryFactory } from "~/server/infrastructure/boardPdsRepository";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cookieSessionStorageFactory } from "~/server/infrastructure/cookieSessionStorage";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import { handleIndexFactory } from "~/server/infrastructure/handleIndex";
import { identityResolverFactory } from "~/server/infrastructure/identityResolver";
import { loggerFactory } from "~/server/infrastructure/logger";
import { oauthClientFactory } from "~/server/infrastructure/oauthClient";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "~/server/infrastructure/oauthStorage";
import { ownerRepositoryFactory } from "~/server/infrastructure/ownerRepository";
import { profileFetcherFactory } from "~/server/infrastructure/profileFetcher";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { atpassportServiceFactory } from "~/server/service/atpassportService/atpassport";
import { authServiceFactory } from "~/server/service/authService/auth";
import { boardEventServiceFactory } from "~/server/service/boardEventService/boardEvent";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { jetstreamServiceFactory } from "~/server/service/jetstreamService/jetstream";
import { ownerServiceFactory } from "~/server/service/ownerService/owner";
import { sessionServiceFactory } from "~/server/service/sessionService/session";

export const di = await createRegistry()
  .value("db", db)
  .service("logger", loggerFactory)
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
    "jetstreamService",
    [
      "cursorRepository",
      "boardEventService",
      "ownerService",
      "profileRecordParser",
      "logger",
    ],
    jetstreamServiceFactory,
  )
  .resolve();
