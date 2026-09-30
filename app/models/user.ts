import { asDid, type Did } from "@atproto/did";

export const INVALID_HANDLE = "handle.invalid";

export class User {
  readonly did: Did;
  readonly avatar: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    description: string | null;
    displayName: string | null;
    handle: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatar = props.avatar;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get handleOrDid() {
    return this.handle === INVALID_HANDLE ? this.did : this.handle;
  }

  withHandle(handle: string) {
    return new User({
      did: this.did,
      avatar: this.avatar,
      description: this.description,
      displayName: this.displayName,
      handle,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  isOwnedBy(viewerDid: Did | null) {
    return this.did === viewerDid;
  }
}
