import { asDid, type Did } from "@atproto/did";

export class User {
  readonly did: Did;
  readonly avatarCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatarCid: string | null;
    description: string | null;
    displayName: string | null;
    handle: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatarCid = props.avatarCid;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isOwnedBy(viewerDid: Did | null) {
    return this.did === viewerDid;
  }
}

export const getAvatarUrl = (user: Pick<User, "did" | "avatarCid">) =>
  user.avatarCid
    ? `https://cdn.bsky.app/img/avatar/plain/${user.did}/${user.avatarCid}@jpeg`
    : null;
