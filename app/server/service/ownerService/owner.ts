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
  // 編集者はセッションのDIDだけで成り立つ。写しが無いときは、DIDで表示し、
  // プロフィールはその場でPDSから取得する。どちらも保存しない
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
    // ログインと閲覧では写しを読むだけにする。ハンドルとDIDの対応は写しから引く
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
  // プロフィールが変わった。持ち主の写しがあれば、レコードの値で更新し、ハンドルを解決し直す
  async updateProfile({ did, profile }) {
    const existing = await ownerDbRepository.findByDid(did);
    if (!existing) {
      return null;
    }
    const resolution = await identityResolver.resolve(did);
    return await ownerDbRepository.save({
      did,
      ...profile,
      // 一時的な障害などで解決できなかったときは、既存の値を残す
      handle:
        resolution.type === "found" ? resolution.identity.handle : undefined,
      updatedAt: new Date(),
    });
  },
});
