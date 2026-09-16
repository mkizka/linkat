import { isDid } from "@atproto/did";
import { asAtIdentifierString } from "@atproto/syntax";
import type { User } from "@prisma/client";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { prisma } from "~/server/service/prisma";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userService");

type UserWriteData = {
  did: string;
  avatar?: string | null;
  description?: string | null;
  displayName?: string | null;
  handle: string;
};

// findOrFetchUserが受け取るDBクライアントの抽象。Prisma固有の型に依存しない
export type UserDbClient = {
  findUser: (handleOrDid: string) => Promise<User | null>;
  upsertUser: (data: UserWriteData) => Promise<User>;
};

const defaultUserDbClient: UserDbClient = {
  findUser: (handleOrDid) => {
    const where = handleOrDid.startsWith("did:")
      ? { did: handleOrDid }
      : { handle: handleOrDid };
    return prisma.user.findFirst({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  upsertUser: (data) =>
    prisma.user.upsert({
      where: { did: data.did },
      create: data,
      update: data,
    }),
};

// 最後の取得から10分以上経過していたら再取得する
const shouldRefetch = (user: User) => {
  return user.updatedAt <= new Date(Date.now() - 10 * 60 * 1000);
};

const fetchBlueskyProfile = async (handleOrDid: string) => {
  logger.info({ actor: handleOrDid }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, {
    actor: asAtIdentifierString(handleOrDid),
  });
};

export const findOrFetchUser = async ({
  tx = defaultUserDbClient,
  handleOrDid,
}: {
  tx?: UserDbClient;
  handleOrDid: string;
}) => {
  if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
    return null;
  }
  const user = await tx.findUser(handleOrDid);
  if (user && !shouldRefetch(user)) {
    return user;
  }
  const blueskyProfile = await tryCatch(fetchBlueskyProfile)(handleOrDid);
  if (blueskyProfile instanceof Error) {
    logger.warn(blueskyProfile, "プロフィールの取得に失敗しました");
    return user;
  }
  return await tx.upsertUser({
    did: blueskyProfile.did,
    avatar: blueskyProfile.avatar,
    description: blueskyProfile.description,
    displayName: blueskyProfile.displayName,
    handle: blueskyProfile.handle,
  });
};
