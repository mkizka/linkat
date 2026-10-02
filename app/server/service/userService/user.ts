import { type Did, isDid } from "@atproto/did";

import type { LinkatAgent } from "~/libs/agent";
import type { User } from "~/models/user";
import type {
  IAccountPdsRepository,
  Profile,
} from "~/server/infrastructure/accountPdsRepository";
import type { IIdentityResolver } from "~/server/infrastructure/identityResolver";
import type { IUserDbRepository } from "~/server/infrastructure/userDbRepository";
import type { IUserRepository } from "~/server/infrastructure/userRepository";

export type Editor = Pick<
  User,
  "did" | "handle" | "avatar" | "avatarCid" | "description" | "displayName"
>;

export interface IUserService {
  findUser: (params: { handleOrDid: string }) => Promise<User | null>;
  // 編集者はセッションのDIDだけで成り立つ。写しが無いときは、DIDで表示し、
  // プロフィールはその場でPDSから取得する。どちらも保存しない
  findEditor: (agent: LinkatAgent) => Promise<Editor>;
  updateProfile: (params: {
    did: Did;
    profile: Profile;
  }) => Promise<User | null>;
}

export const userServiceFactory = ({
  userRepository,
  userDbRepository,
  accountPdsRepository,
  identityResolver,
}: {
  userRepository: IUserRepository;
  userDbRepository: IUserDbRepository;
  accountPdsRepository: IAccountPdsRepository;
  identityResolver: IIdentityResolver;
}): IUserService => ({
  async findUser({ handleOrDid }) {
    if (!handleOrDid.includes(".") && !isDid(handleOrDid)) {
      return null;
    }
    return await userRepository.findByHandleOrDid(handleOrDid);
  },
  async findEditor(agent) {
    const did = agent.assertDid;
    const owner = await userDbRepository.findByDid(did);
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
  // プロフィールが変わった。持ち主の写しがあれば、レコードの値で更新し、ハンドルを解決し直す
  async updateProfile({ did, profile }) {
    const existing = await userDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const resolution = await identityResolver.resolve(did);
    return await userDbRepository.save({
      did,
      ...profile,
      // 一時的な障害などで解決できなかったときは、既存の値を残す
      handle:
        resolution.type === "found" ? resolution.identity.handle : undefined,
      updatedAt: new Date(),
    });
  },
});
