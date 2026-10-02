import type { Did } from "@atproto/did";
import { getBlobCidString, lexParse } from "@atproto/lex";

import profile, {
  type Main as ProfileRecord,
} from "~/generated/app/bsky/actor/profile";
import { LinkatAgent } from "~/libs/agent";
import type { Owner } from "~/models/owner";
import type {
  Identity,
  IIdentityResolver,
} from "~/server/infrastructure/identityResolver";
import { createLogger } from "~/utils/logger";
import { tryCatch } from "~/utils/tryCatch";

const logger = createLogger("accountPdsRepository");

export type Profile = Pick<
  Owner,
  "avatar" | "avatarCid" | "description" | "displayName"
>;

export interface IAccountPdsRepository {
  // ハンドルを解決し、プロフィールを取得する。写しへの書き込みの中でだけ使う
  // プロフィールの取得に失敗したときは、profileをnullにする
  resolveAccount: (did: Did) => Promise<{
    handle: Identity["handle"];
    profile: Profile | null;
  }>;
  // OAuthセッションのPDSからプロフィールを取得する。ハンドルは解決しない
  fetchSessionProfile: (agent: LinkatAgent) => Promise<Profile | null>;
}

const toProfile = (value: ProfileRecord): Profile => ({
  avatar: null,
  avatarCid: getBlobCidString(value.avatar) ?? null,
  description: value.description ?? null,
  displayName: value.displayName ?? null,
});

// JetstreamなどからJSONで受け取ったプロフィールのレコードを変換する。不正な値ならnullを返す
export const parseProfileRecord = (json: unknown): Profile | null => {
  try {
    const result = profile.safeParse(lexParse(JSON.stringify(json)));
    return result.success ? toProfile(result.value) : null;
  } catch {
    return null;
  }
};

const fetchProfile = async (agent: LinkatAgent, did: Did) => {
  const { value } = await agent.get(profile, { repo: did });
  return toProfile(value);
};

const tryFetchProfile = async (agent: LinkatAgent, did: Did) => {
  const fetched = await tryCatch(fetchProfile)(agent, did);
  if (fetched instanceof Error) {
    logger.warn(fetched, "プロフィールの取得に失敗しました");
    return null;
  }
  return fetched;
};

const fetchProfileFromPds = ({ did, pds }: { did: Did; pds: string }) => {
  logger.info({ did, pds }, "プロフィールを取得します");
  return tryFetchProfile(LinkatAgent.credential(pds), did);
};

export const accountPdsRepositoryFactory = ({
  identityResolver,
}: {
  identityResolver: IIdentityResolver;
}): IAccountPdsRepository => ({
  async resolveAccount(did) {
    const resolution = await identityResolver.resolve(did);
    switch (resolution.type) {
      case "found":
        return {
          handle: resolution.identity.handle,
          profile: await fetchProfileFromPds(resolution.identity),
        };
      // DIDドキュメントが無ければ、検証済みのハンドルも無い
      case "notFound":
        return { handle: null, profile: null };
      // 一時的な障害のときは、既存のハンドルを残す
      case "unavailable":
        return { handle: undefined, profile: null };
    }
  },
  async fetchSessionProfile(agent) {
    return await tryFetchProfile(agent, agent.assertDid);
  },
});
