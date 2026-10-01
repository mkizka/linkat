import { asDid, type Did } from "@atproto/did";

const HIDDEN_STATUSES = ["takendown", "suspended", "deleted", "deactivated"];

export class User {
  readonly did: Did;
  readonly avatar: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    description: string | null;
    displayName: string | null;
    handle: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatar = props.avatar;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isHidden() {
    return HIDDEN_STATUSES.includes(this.status);
  }

  isOwnedBy(viewerDid: Did | null) {
    return this.did === viewerDid;
  }
}
