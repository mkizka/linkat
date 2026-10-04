import { createRegistry } from "@gyaku/di";

import { accountPdsRepositoryFactory } from "~/server/infrastructure/accountPdsRepository";
import { atpassportClientFactory } from "~/server/infrastructure/atpassportClient";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cookieSessionStorageFactory } from "~/server/infrastructure/cookieSessionStorage";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import { handleIndexFactory } from "~/server/infrastructure/handleIndex";
import { identityResolverFactory } from "~/server/infrastructure/identityResolver";
import { oauthClientFactory } from "~/server/infrastructure/oauthClient";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "~/server/infrastructure/oauthStorage";
import { profileRecordParserFactory } from "~/server/infrastructure/profileRecordParser";
import { userDbRepositoryFactory } from "~/server/infrastructure/userDbRepository";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";
import { atpassportServiceFactory } from "~/server/service/atpassportService/atpassport";
import { authServiceFactory } from "~/server/service/authService/auth";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { jetstreamServiceFactory } from "~/server/service/jetstreamService/jetstream";
import { sessionServiceFactory } from "~/server/service/sessionService/session";
import { userServiceFactory } from "~/server/service/userService/user";

export const di = await createRegistry()
  .value("db", db)
  .service("boardRepository", ["db"], boardRepositoryFactory)
  .service("cursorRepository", ["db"], cursorRepositoryFactory)
  .service("userDbRepository", ["db"], userDbRepositoryFactory)
  .service("handleIndex", ["db"], handleIndexFactory)
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
  .service(
    "userRepository",
    ["userDbRepository", "accountPdsRepository"],
    userRepositoryFactory,
  )
  .service("atpassportClient", atpassportClientFactory)
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service("userService", ["handleIndex", "userRepository"], userServiceFactory)
  .service(
    "boardService",
    ["boardRepository", "userDbRepository", "accountPdsRepository"],
    boardServiceFactory,
  )
  .service("atpassportService", ["atpassportClient"], atpassportServiceFactory)
  .service("authService", ["oauthClient"], authServiceFactory)
  .service(
    "sessionService",
    ["cookieSessionStorage", "oauthClient", "userService"],
    sessionServiceFactory,
  )
  .service(
    "jetstreamService",
    [
      "cursorRepository",
      "boardService",
      "userService",
      "userDbRepository",
      "identityResolver",
      "profileRecordParser",
    ],
    jetstreamServiceFactory,
  )
  .resolve();
