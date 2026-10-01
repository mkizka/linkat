import { type Did, isAtprotoDid } from "@atproto/did";

import type { User } from "~/models/user";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export interface IUserService {
  resolveDid: (handleOrDid: string) => Promise<Did | null>;
  findUser: (params: { did: Did }) => Promise<User | null>;
}

export const userServiceFactory = ({
  identityResolver,
  userRepository,
}: {
  identityResolver: IIdentityResolver;
  userRepository: IUserRepository;
}): IUserService => ({
  async resolveDid(handleOrDid) {
    if (isAtprotoDid(handleOrDid)) {
      return handleOrDid;
    }
    return await identityResolver.resolveHandle(handleOrDid);
  },
  async findUser({ did }) {
    return await userRepository.findByDid(did);
  },
});
