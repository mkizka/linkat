import type { LinkatAgent } from "~/libs/agent";
import { User, type UserView } from "~/models/user";
import type { IProfileFetcher } from "~/server/infrastructure/profileFetcher";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";

export interface IEditorService {
  findView: (agent: LinkatAgent) => Promise<UserView>;
}

export const editorServiceFactory = ({
  userDbRepository,
  profileFetcher,
}: {
  userDbRepository: IUserDbRepository;
  profileFetcher: IProfileFetcher;
}): IEditorService => ({
  async findView(agent) {
    const did = agent.assertDid;
    const owner = await userDbRepository.findByDid(did);
    if (owner) {
      return owner.toView();
    }
    const profile = await profileFetcher.fetchProfile(agent, did);
    return User.create(did).withProfile(profile).toView();
  },
});
