import type { LinkatAgent } from "~/libs/agent";
import { Owner, type OwnerView } from "~/models/owner";
import type { IOwnerDbRepository } from "~/server/infrastructure/ownerDbRepository";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";

export interface IEditorService {
  findView: (agent: LinkatAgent) => Promise<OwnerView>;
}

export const editorServiceFactory = ({
  ownerDbRepository,
  profileFetcher,
}: {
  ownerDbRepository: IOwnerDbRepository;
  profileFetcher: IProfileFetcher;
}): IEditorService => ({
  async findView(agent) {
    const did = agent.assertDid;
    const owner = await ownerDbRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const profile = await profileFetcher.fetchProfile(agent, did);
    return Owner.create(did).withProfile(profile).toView();
  },
});
