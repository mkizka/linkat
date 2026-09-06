import { isDid } from "@atproto/did";
import { asAtIdentifierString } from "@atproto/syntax";
import type { Prisma, User } from "@prisma/client";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";
import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { prisma } from "~/server/service/prisma";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userService");

// 最後の取得から10分以上経過していたら再取得する
const shouldRefetch = (user: User) => {
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
  return user;
};

const createOrUpdateUser = async ({
  tx,
  blueskyProfile,
}: {
  tx: Prisma.TransactionClient;
  blueskyProfile: ProfileViewDetailed;
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
  logger.info({ actor: handleOrDid }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, {
    actor: asAtIdentifierString(handleOrDid),
  });
};

export const findOrFetchUser = async ({
  tx = prisma,
  handleOrDid,
}: {
  tx?: Prisma.TransactionClient;
  handleOrDid: string;
}) => {
  if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
    return null;
  }
  const user = await findUser({ tx, handleOrDid });
  if (user && !shouldRefetch(user)) {
    return user;
  }
  const blueskyProfile = await tryCatch(fetchBlueskyProfile)(handleOrDid);
  if (blueskyProfile instanceof Error) {
    logger.warn(blueskyProfile, "プロフィールの取得に失敗しました");
    return user;
  }
  return await createOrUpdateUser({
    tx,
    blueskyProfile,
  });
};
