import { type Did, isDid } from "@atproto/did";

import type { AccountStatus, User } from "~/models/user";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userServiceFactory = ({
  userRepository,
}: {
  userRepository: IUserRepository;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    return await userRepository.findByHandleOrDid(handleOrDid);
  },
  async updateStatus(did, status) {
    await userRepository.updateStatus(did, status);
  },
});
