import type { LinkatAgent } from "~/libs/agent";
import { Owner, type OwnerView } from "~/models/owner";
import type { IOwnerRepository } from "~/server/infrastructure/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IEditorService {
  findView: (agent: LinkatAgent) => Promise<OwnerView>;
}

export const editorServiceFactory = ({
  ownerRepository,
  profileFetcher,
}: {
  ownerRepository: IOwnerRepository;
  profileFetcher: IProfileFetcher;
}): IEditorService => ({
  async findView(agent) {
    const did = agent.assertDid;
    const owner = await ownerRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const profile = await profileFetcher.fetchProfile(agent, did);
    return Owner.create(did).withProfile(profile).toView();
  },
});
