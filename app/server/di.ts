import { createRegistry } from "@gyaku/di";

import { atpassportClientFactory } from "~/server/infrastructure/atpassportClient";
import { boardRepositoryFactory } from "~/server/infrastructure/boardRepository";
import { cookieSessionStorageFactory } from "~/server/infrastructure/cookieSessionStorage";
import { cursorRepositoryFactory } from "~/server/infrastructure/cursorRepository";
import { db } from "~/server/infrastructure/drizzle";
import { oauthClientFactory } from "~/server/infrastructure/oauthClient";
import {
  sessionStoreFactory,
  stateStoreFactory,
} from "~/server/infrastructure/oauthStorage";
import { userRepositoryFactory } from "~/server/infrastructure/userRepository";
import { atpassportServiceFactory } from "~/server/service/atpassportService/atpassport";
import { authServiceFactory } from "~/server/service/authService/auth";
import { boardServiceFactory } from "~/server/service/boardService/board";
import { didServiceFactory } from "~/server/service/didService/did";
import { jetstreamServiceFactory } from "~/server/service/jetstreamService/jetstream";
import { sessionServiceFactory } from "~/server/service/sessionService/session";
import { userServiceFactory } from "~/server/service/userService/user";
import { env } from "~/utils/env";

const registry = createRegistry()
  .value("db", db)
  .service("boardRepository", ["db"], boardRepositoryFactory)
  .service("cursorRepository", ["db"], cursorRepositoryFactory)
  .service("userRepository", ["db"], userRepositoryFactory)
  .service("oauthStateStore", ["db"], stateStoreFactory)
  .service("oauthSessionStore", ["db"], sessionStoreFactory)
  .service(
    "oauthClient",
    ["oauthStateStore", "oauthSessionStore"],
    oauthClientFactory,
  )
  .service("atpassportClient", atpassportClientFactory)
  .service("cookieSessionStorage", cookieSessionStorageFactory)
  .service("didService", didServiceFactory)
  .service("userService", ["userRepository"], userServiceFactory)
  .service(
    "boardService",
    ["boardRepository", "didService"],
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
    ["cursorRepository", "boardService", "userService"],
    jetstreamServiceFactory,
  );

export type Registry = typeof registry;

// E2Eのmediumテストでは外部システムへの接続をモックに置き換える
const activeRegistry: Registry = env.E2E_MOCK
  ? (await import("~/server/mocks/registry")).replaceWithMocks(registry)
  : registry;

export const di = await activeRegistry.resolve();
