import { type Did, isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import { type AccountStatus, Owner, type OwnerView } from "~/models/owner";
import type { IAccountPdsRepository } from "~/server/infrastructure/accountPdsRepository";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";

export interface IOwnerService {
  findOwner: (params: { handleOrDid: string }) => Promise<Owner | null>;
  findEditor: (agent: LinkatAgent) => Promise<OwnerView>;
  updateStatus: (did: Did, status: AccountStatus) => Promise<void>;
}

export const ownerServiceFactory = ({
  ownerDbRepository,
  accountPdsRepository,
}: {
  ownerDbRepository: IOwnerDbRepository;
  accountPdsRepository: IAccountPdsRepository;
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
    return Owner.create(did).withProfile(profile).toView();
  },
  async updateStatus(did, status) {
    await ownerDbRepository.updateStatus(did, status);
  },
});
