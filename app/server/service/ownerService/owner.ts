import { type Did, isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, Owner, type OwnerView } from "~/models/owner";
import {
  emptyProfile,
  type IAccountPdsRepository,
  type Profile,
} from "~/server/infrastructure/accountPdsRepository";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";

export interface IOwnerService {
  findOwner: (params: { handleOrDid: string }) => Promise<Owner | null>;
  findEditor: (agent: LinkatAgent) => Promise<OwnerView>;
  updateProfile: (params: {
    did: Did;
    profile: Profile;
  }) => Promise<Owner | null>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
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
    return await (isDid(handleOrDid)
      ? ownerDbRepository.findByDid(handleOrDid)
      : ownerDbRepository.findByHandle(handleOrDid));
  },
  async findEditor(agent) {
    const did = agent.assertDid;
    const owner = await ownerDbRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const profile = await accountPdsRepository.fetchSessionProfile(agent);
    return new Owner({
      did,
      handle: null,
      status: "active",
      ...(profile ?? emptyProfile),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).toView();
  },
  async updateProfile({ did, profile }) {
    const existing = await ownerDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const identity = await identityResolver.resolve(did);
    return await ownerDbRepository.save({
      did,
      ...profile,
      handle: identity?.handle ?? null,
      updatedAt: new Date(),
    });
  },
  async updateStatus(did, status) {
    await ownerDbRepository.updateStatus(did, status);
  },
});
