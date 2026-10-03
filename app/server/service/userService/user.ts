import { isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export type Editor = Pick<
  User,
  "did" | "handle" | "avatar" | "avatarCid" | "description" | "displayName"
>;

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  findEditor: (agent: LinkatAgent) => Promise<Editor>;
}

export const userServiceFactory = ({
  userRepository,
  userDbRepository,
  accountPdsRepository,
}: {
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    return await userRepository.findByHandleOrDid(handleOrDid);
  },
  async findEditor(agent) {
    const did = agent.assertDid;
    const owner = await userDbRepository.findByDid(did);
    if (owner) {
      return owner;
    }
    const profile = await accountPdsRepository.fetchSessionProfile(agent);
    return {
      did,
      handle: null,
      avatar: profile?.avatar ?? null,
      avatarCid: profile?.avatarCid ?? null,
      description: profile?.description ?? null,
      displayName: profile?.displayName ?? null,
    };
  },
});
