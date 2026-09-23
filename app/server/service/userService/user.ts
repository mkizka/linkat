import { isDid } from "@atproto/did";
import { asAtIdentifierString } from "@atproto/syntax";

import getProfile from "~/generated/app/bsky/actor/getProfile";
import { LinkatAgent } from "~/libs/agent";
import { User } from "~/models/user";
import type { IUserRepository } from "~/server/infrastructure/userRepository";
import { env } from "~/utils/env";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("userService");

const fetchBlueskyProfile = async (handleOrDid: string) => {
  logger.info({ actor: handleOrDid }, "プロフィールを取得します");
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  return await agent.call(getProfile, {
    actor: asAtIdentifierString(handleOrDid),
  });
};

export interface IUserService {
  findOrFetchUser: (params: { handleOrDid: string }) => Promise<User | null>;
}

export const userServiceFactory = ({
  userRepository,
}: {
  userRepository: IUserRepository;
}): IUserService => ({
  async findOrFetchUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    const user = await (isDid(handleOrDid)
      ? userRepository.findByDid(handleOrDid)
      : userRepository.findByHandle(handleOrDid));
    if (user && !user.shouldRefetch()) {
      return user;
    }
    const blueskyProfile = await tryCatch(fetchBlueskyProfile)(handleOrDid);
    if (blueskyProfile instanceof Error) {
      logger.warn(blueskyProfile, "プロフィールの取得に失敗しました");
      return user;
    }
    const newUser = user
      ? user.withProfile(blueskyProfile)
      : User.fromProfile(blueskyProfile);
    await userRepository.save(newUser);
    return newUser;
  },
});
