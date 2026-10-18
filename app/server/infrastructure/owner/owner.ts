import type { Did } from "@atproto/did";

export type AccountState = { active: boolean; status: string | null };

export type Profile = {
  avatarCid: string | null;
  description: string | null;
  displayName: string | null;
};

export type Owner = Profile &
  AccountState & {
    did: Did;
    handle: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
