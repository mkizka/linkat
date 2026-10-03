import { isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { User, type UserView } from "~/models/user";
import {
  emptyProfile,
  type IAccountPdsRepository,
} from "~/server/infrastructure/accountPdsRepository";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  findEditor: (agent: LinkatAgent) => Promise<UserView>;
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
      return owner.toView();
    }
    const profile = await accountPdsRepository.fetchSessionProfile(agent);
    const now = new Date();
    return new User({
      did,
      handle: null,
      ...(profile ?? emptyProfile),
      createdAt: now,
      updatedAt: now,
    }).toView();
  },
});
