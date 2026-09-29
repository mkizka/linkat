import { AtprotoHandleResolverNode } from "@atproto-labs/handle-resolver-node";
import {
  createIdentityResolver,
  type IdentityResolver,
} from "@atproto-labs/identity-resolver";

import { env, isProduction } from "~/utils/env";

export type { IdentityResolver };

export const identityResolverFactory = (): IdentityResolver =>
  createIdentityResolver({
    plcDirectoryUrl: env.ATPROTO_PLC_URL,
    handleResolver:
      env.ATPROTO_HANDLE_RESOLVER_URL ?? new AtprotoHandleResolverNode(),
    allowHttp: !isProduction,
  });
