import { asDid, type Did } from "@atproto/did";

export type AccountStatus =
  "active" | "suspended" | "deleted" | "deactivated" | "inactive";

export class User {
  readonly did: Did;
  readonly avatar: string | null;
  readonly avatarCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string | null;
  readonly status: AccountStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    avatarCid: string | null;
    description: string | null;
    displayName: string | null;
    handle: string | null;
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

  withHandle(handle: string | null) {
    return new User({
      did: this.did,
      avatar: this.avatar,
      avatarCid: this.avatarCid,
      description: this.description,
      displayName: this.displayName,
      handle,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  withProfile(
    profile: Pick<
      User,
      "avatar" | "avatarCid" | "description" | "displayName"
    > | null,
  ) {
    return new User({
      did: this.did,
      avatar: profile?.avatar ?? null,
      avatarCid: profile?.avatarCid ?? null,
      description: profile?.description ?? null,
      displayName: profile?.displayName ?? null,
      handle: this.handle,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  toView() {
    return {
      did: this.did,
      handleOrDid: this.handle ?? this.did,
      displayHandle: `@${this.handle ?? this.did}`,
      displayName: this.displayName,
      avatarUrl: this.avatarCid
        ? `https://cdn.bsky.app/img/avatar/plain/${this.did}/${this.avatarCid}@jpeg`
        : this.avatar,
    };
  }
}

export type UserView = ReturnType<User["toView"]>;
