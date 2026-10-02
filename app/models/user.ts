import { asDid, type Did } from "@atproto/did";

export type AccountStatus = "active" | "suspended" | "deleted" | "deactivated";

export class User {
  readonly did: Did;
  readonly avatar: string | null;
  readonly avatarCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    avatarCid: string | null;
    description: string | null;
    displayName: string | null;
    handle: string;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatar = props.avatar;
    this.avatarCid = props.avatarCid;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isHidden() {
    return this.status !== "active";
  }

  isOwnedBy(viewerDid: Did | null) {
    return this.did === viewerDid;
  }
}

export const getAvatarUrl = (
  user: Pick<User, "did" | "avatar" | "avatarCid">,
) =>
  user.avatarCid
    ? `https://cdn.bsky.app/img/avatar/plain/${user.did}/${user.avatarCid}@jpeg`
    : user.avatar;
