import type { ownerTable } from "~/server/infrastructure/db/schema";

export type Owner = typeof ownerTable.$inferSelect;

export type AccountState = { active: boolean; status: string | null };

export type Profile = {
  avatarCid: string | null;
  description: string | null;
  displayName: string | null;
};
