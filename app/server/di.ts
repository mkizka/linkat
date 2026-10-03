import { createRegistry } from "@gyaku/di";

import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { atpassportClientFactory } from "~/server/infrastructure/atpassportClient";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cookieSessionStorageFactory } from "~/server/infrastructure/cookieSessionStorage";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import { identityResolverFactory } from "~/server/infrastructure/identityResolver";
import { oauthClientFactory } from "~/server/infrastructure/oauthClient";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "~/server/infrastructure/oauthStorage";
import { ownerDbRepositoryFactory } from "~/server/infrastructure/ownerDbRepository";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { atpassportServiceFactory } from "~/server/service/atpassportService/atpassport";
import { authServiceFactory } from "~/server/service/authService/auth";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { jetstreamServiceFactory } from "~/server/service/jetstreamService/jetstream";
import { ownerServiceFactory } from "~/server/service/ownerService/owner";
import { sessionServiceFactory } from "~/server/service/sessionService/session";

export const di = await createRegistry()
  .value("db", db)
  .service("boardRepository", ["db"], boardRepositoryFactory)
  .service("cursorRepository", ["db"], cursorRepositoryFactory)
  .service("ownerDbRepository", ["db"], ownerDbRepositoryFactory)
  .service("oauthStateStore", ["db"], stateStoreFactory)
  .service("oauthSessionStore", ["db"], sessionStoreFactory)
  .service("identityResolver", identityResolverFactory)
  .service("profileRecordParser", profileRecordParserFactory)
  .service(
    "oauthClient",
    ["oauthStateStore", "oauthSessionStore"],
    oauthClientFactory,
  )
  .service(
    "accountPdsRepository",
    ["identityResolver", "profileRecordParser"],
    accountPdsRepositoryFactory,
  )
  .service("atpassportClient", atpassportClientFactory)
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service(
    "ownerService",
    ["ownerDbRepository", "accountPdsRepository"],
    ownerServiceFactory,
  )
  .service(
    "boardService",
    ["boardRepository", "ownerDbRepository", "accountPdsRepository"],
    boardServiceFactory,
  )
  .service("atpassportService", ["atpassportClient"], atpassportServiceFactory)
  .service("authService", ["oauthClient"], authServiceFactory)
  .service(
    "sessionService",
    ["cookieSessionStorage", "oauthClient"],
    sessionServiceFactory,
  )
  .service(
    "jetstreamService",
    [
      "cursorRepository",
      "boardService",
      "ownerService",
      "ownerDbRepository",
      "identityResolver",
      "profileRecordParser",
    ],
    jetstreamServiceFactory,
  )
  .resolve();
