import type { AppBskyActorDefs } from "@atproto/api";
import { AtpAgent } from "@atproto/api";
import type { Prisma, User } from "@prisma/client";

import { prisma } from "~/server/service/prisma";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userService");

// 最後の取得から10分以上経過していたら再取得する
const shouldReFetch = (user: User) => {
  return user.updatedAt <= new Date(Date.now() - 10 * 60 * 1000);
};

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
  const user = await tx.user.findFirst({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
  if (!user || shouldReFetch(user)) {
    return null;
  }
  return user;
};

const createOrUpdateUser = async ({
  tx,
  blueskyProfile,
}: {
  tx: Prisma.TransactionClient;
  blueskyProfile: AppBskyActorDefs.ProfileViewDetailed;
}) => {
  const data = {
    did: blueskyProfile.did,
    avatar: blueskyProfile.avatar,
    description: blueskyProfile.description,
    displayName: blueskyProfile.displayName,
    handle: blueskyProfile.handle,
  } satisfies Prisma.UserUpsertArgs["create"];
  return await tx.user.upsert({
    where: {
      did: blueskyProfile.did,
    },
    create: data,
    update: data,
  });
};

const fetchBlueskyProfile = async (handleOrDid: string) => {
  logger.info("プロフィールを取得します", { actor: handleOrDid });
  const publicAgent = new AtpAgent({
    service: env.VITE_BSKY_PUBLIC_API_URL,
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
  return await createOrUpdateUser({
    tx,
    blueskyProfile,
  });
};
