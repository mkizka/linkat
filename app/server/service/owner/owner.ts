import type { Did } from "@atproto/did";

import type { IIdentityResolver } from "~/server/infrastructure/owner/identityResolver";
import type {
  AccountStateDto,
  OwnerDto,
  ProfileDto,
} from "~/server/infrastructure/owner/ownerDto";
import type { IOwnerRepository } from "~/server/infrastructure/owner/ownerRepository";
import type { IProfileFetcher } from "~/server/infrastructure/owner/profileFetcher";

import type { IOwnerViewService, OwnerView } from "./ownerView";

export type EditorView = OwnerView & { synced: boolean };

export interface IOwnerService {
  findEditorView: (did: Did) => Promise<EditorView>;
  syncOwner: (did: Did) => Promise<OwnerDto>;
  updateProfile: (
    did: Did,
    profile: ProfileDto | null,
  ) => Promise<OwnerDto | null>;
  refreshHandle: (did: Did) => Promise<OwnerDto | null>;
  updateAccountState: (did: Did, state: AccountStateDto) => Promise<void>;
}

export const ownerServiceFactory = ({
  ownerRepository,
  profileFetcher,
  identityResolver,
  ownerViewService,
}: {
  ownerRepository: IOwnerRepository;
  profileFetcher: IProfileFetcher;
  identityResolver: IIdentityResolver;
  ownerViewService: IOwnerViewService;
}): IOwnerService => ({
  async findEditorView(did) {
    const owner = await ownerRepository.findByDid(did);
    return { ...ownerViewService.toOwnerView(did, owner), synced: !!owner };
  },
  async syncOwner(did) {
    const identity = await identityResolver.resolve(did);
    if (!identity) {
      return await ownerRepository.upsert(did, { handle: null });
    }
    const profile = await profileFetcher.fetchProfile(identity.pds, did);
    if (profile instanceof Error) {
      return await ownerRepository.upsert(did, { handle: identity.handle });
    }
    return await ownerRepository.upsert(did, {
      handle: identity.handle,
      profile,
    });
  },
  async updateProfile(did, profile) {
    if (!(await ownerRepository.findByDid(did))) {
      return null;
    }
    const identity = await identityResolver.resolve(did);
    return await ownerRepository.updateProfile(did, {
      handle: identity?.handle ?? null,
      profile,
    });
  },
  async refreshHandle(did) {
    if (!(await ownerRepository.findByDid(did))) {
      return null;
    }
    const identity = await identityResolver.resolve(did, { fresh: true });
    return await ownerRepository.updateHandle(did, identity?.handle ?? null);
  },
  async updateAccountState(did, state) {
    await ownerRepository.updateAccountState(did, state);
  },
});
