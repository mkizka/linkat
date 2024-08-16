import type { AppBskyActorDefs } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import type { Prisma } from "@prisma/client";

import { prisma } from "~/.server/service/prisma";
import { serverEnv } from "~/.server/utils/server-env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userService");

const findUser = async ({
  tx,
  handleOrDid,
}: {
  tx: Prisma.TransactionClient;
  handleOrDid: string;
}) => {
  const where = handleOrDid.startsWith("did:")
    ? { did: handleOrDid }
    : { handle: handleOrDid };
  return await tx.user.findUnique({
    where,
  });
};

const createUser = async ({
  tx,
  blueskyProfile,
}: {
  tx: Prisma.TransactionClient;
  blueskyProfile: AppBskyActorDefs.ProfileViewDetailed;
}) => {
  return await tx.user.create({
    data: {
      did: blueskyProfile.did,
      description: blueskyProfile.description,
      displayName: blueskyProfile.displayName,
      handle: blueskyProfile.handle,
    },
  });
};

const fetchBlueskyProfile = async (handleOrDid: string) => {
  logger.info("プロフィールを取得します", { actor: handleOrDid });
  const publicAgent = new AtpAgent({
    service: serverEnv.PUBLIC_BSKY_URL,
  });
  const response = await publicAgent.getProfile({
    actor: handleOrDid,
  });
  return response.data;
};

export const findOrFetchUser = async ({
  tx = prisma,
  handleOrDid,
}: {
  tx?: Prisma.TransactionClient;
  handleOrDid: string;
}) => {
  const user = await findUser({ tx, handleOrDid });
  if (user) {
    return user;
  }
  const blueskyProfile = await tryCatch(fetchBlueskyProfile)(handleOrDid);
  if (blueskyProfile instanceof Error) {
    logger.warn("プロフィールの取得に失敗しました", {
      error: blueskyProfile.message,
    });
    return null;
  }
  return await createUser({
    tx,
    blueskyProfile,
  });
};
