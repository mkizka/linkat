import { type Did, isDid } from "@atproto/did";

import type { AccountStatus, User } from "~/models/user";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userServiceFactory = ({
  handleIndex,
  userRepository,
}: {
  handleIndex: IHandleIndex;
  userRepository: IUserRepository;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    const did = isDid(handleOrDid)
      ? handleOrDid
      : await handleIndex.findDid(handleOrDid);
    return did && (await userRepository.findByDid(did));
  },
  async updateStatus(did, status) {
    await userRepository.updateStatus(did, status);
  },
});
