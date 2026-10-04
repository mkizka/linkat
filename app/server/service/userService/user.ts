import { type Did, isDid } from "@atproto/did";

import { type AccountStatus, User } from "~/models/user";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IHandleIndex } from "~/server/infrastructure/handleIndex";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  syncOwner: (did: Did) => Promise<User>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const userServiceFactory = ({
  handleIndex,
  userRepository,
  userDbRepository,
  accountPdsRepository,
}: {
  handleIndex: IHandleIndex;
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
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
  async syncOwner(did) {
    const fetched = await accountPdsRepository.findByDid(did);
    let owner = (await userDbRepository.findByDid(did)) ?? User.create(did);
    if (fetched?.profile) {
      owner = owner.withProfile(fetched.profile);
    }
    return await userDbRepository.save(
      owner.withHandle(fetched?.handle ?? null),
    );
  },
  async updateStatus(did, status) {
    await userRepository.updateStatus(did, status);
  },
});
