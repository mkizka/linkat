import { asDid, type Did } from "@atproto/did";

export class Owner {
  readonly did: Did;
  readonly avatar: string | null;
  readonly avatarCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    avatarCid: string | null;
    description: string | null;
    displayName: string | null;
    handle: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatar = props.avatar;
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

// 写しのハンドルが無いときは、表示とURLにDIDを使う
export const getHandleOrDid = (owner: Pick<Owner, "did" | "handle">) =>
  owner.handle ?? owner.did;

export const getAvatarUrl = (
  owner: Pick<Owner, "did" | "avatar" | "avatarCid">,
) =>
  owner.avatarCid
    ? `https://cdn.bsky.app/img/avatar/plain/${owner.did}/${owner.avatarCid}@jpeg`
    : owner.avatar;
