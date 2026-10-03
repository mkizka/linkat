import { type Did, isDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  refreshUser: (params: { did: Did }) => Promise<User | null>;
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
  async refreshUser({ did }) {
    return await userRepository.refresh(did);
  },
});
