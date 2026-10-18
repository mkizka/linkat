import type { Did } from "@atproto/did";

export type AccountStateDto = { active: boolean; status: string | null };

export type ProfileDto = {
  avatarCid: string | null;
  description: string | null;
  displayName: string | null;
};

export type OwnerDto = ProfileDto &
  AccountStateDto & {
    did: Did;
    handle: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
