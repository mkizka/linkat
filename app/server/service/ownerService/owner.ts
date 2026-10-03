import { type Did, isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import type { Owner } from "~/models/owner";
import type {
  IAccountPdsRepository,
  Profile,
} from "~/server/infrastructure/accountPdsRepository";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";

export type Editor = Pick<
  Owner,
  "did" | "handle" | "avatar" | "avatarCid" | "description" | "displayName"
>;

export interface IOwnerService {
  findOwner: (params: { handleOrDid: string }) => Promise<Owner | null>;
  findEditor: (agent: LinkatAgent) => Promise<Editor>;
  updateProfile: (params: {
    did: Did;
    profile: Profile;
  }) => Promise<Owner | null>;
}

export const ownerServiceFactory = ({
  ownerDbRepository,
  accountPdsRepository,
  identityResolver,
}: {
  ownerDbRepository: IOwnerDbRepository;
  accountPdsRepository: IAccountPdsRepository;
  identityResolver: IIdentityResolver;
}): IOwnerService => ({
  async findOwner({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    return await (isDid(handleOrDid)
      ? ownerDbRepository.findByDid(handleOrDid)
      : ownerDbRepository.findByHandle(handleOrDid));
  },
  async findEditor(agent) {
    const did = agent.assertDid;
    const owner = await ownerDbRepository.findByDid(did);
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
  async updateProfile({ did, profile }) {
    const existing = await ownerDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const resolution = await identityResolver.resolve(did);
    return await ownerDbRepository.save({
      did,
      ...profile,
      handle:
        resolution.type === "found" ? resolution.identity.handle : undefined,
      updatedAt: new Date(),
    });
  },
});
