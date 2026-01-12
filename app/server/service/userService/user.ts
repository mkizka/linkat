import type { AppBskyActorDefs } from "@atproto/api";
import { isDid } from "@atproto/did";
import type { Prisma, User } from "@prisma/client";

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
  logger.info({ actor: handleOrDid }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  const response = await agent.getProfile({
    actor: handleOrDid,
  });
  return response.data;
};

// バックグラウンドでユーザー情報を更新する
const updateUserInBackground = (handleOrDid: string) => {
  // awaitせずにPromiseを開始してバックグラウンドで実行
  tryCatch(async () => {
    logger.info({ actor: handleOrDid }, "バックグラウンドでプロフィールを更新します");
    const blueskyProfile = await fetchBlueskyProfile(handleOrDid);
    await createOrUpdateUser({
      tx: prisma,
      blueskyProfile,
    });
    logger.info({ actor: handleOrDid }, "バックグラウンドでのプロフィール更新が完了しました");
  })().catch((error) => {
    logger.warn(error, "バックグラウンドでのプロフィール更新に失敗しました");
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

  // ユーザーが存在する場合
  if (user) {
    // データが古い場合はバックグラウンドで更新
    if (shouldRefetch(user)) {
      updateUserInBackground(handleOrDid);
    }
    return user;
  }

  // ユーザーが存在しない場合(初回訪問)は、PDSから取得してから返す
  const blueskyProfile = await tryCatch(fetchBlueskyProfile)(handleOrDid);
  if (blueskyProfile instanceof Error) {
    logger.warn(blueskyProfile, "プロフィールの取得に失敗しました");
    return null;
  }
  return await createOrUpdateUser({
    tx,
    blueskyProfile,
  });
};
