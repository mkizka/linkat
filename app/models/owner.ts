import { asDid, type Did } from "@atproto/did";

export type AccountState = { active: boolean; status: string | null };

export type Profile = {
  avatar: string | null;
  avatarCid: string | null;
  description: string | null;
  displayName: string | null;
};

export class Owner {
  readonly did: Did;
  readonly avatar: string | null;
  readonly avatarCid: string | null;
  readonly description: string | null;
  readonly displayName: string | null;
  readonly handle: string | null;
  readonly active: boolean;
  readonly status: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    did: string;
    avatar: string | null;
    avatarCid: string | null;
    description: string | null;
    displayName: string | null;
    handle: string | null;
    active: boolean;
    status: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.did = asDid(props.did);
    this.avatar = props.avatar;
    this.avatarCid = props.avatarCid;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.active = props.active;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(did: Did) {
    const now = new Date();
    return new Owner({
      did,
      avatar: null,
      avatarCid: null,
      description: null,
      displayName: null,
      handle: null,
      active: true,
      status: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  isHidden() {
    return !this.active;
  }

  withHandle(handle: string | null) {
    return new Owner({
      did: this.did,
      avatar: this.avatar,
      avatarCid: this.avatarCid,
      description: this.description,
      displayName: this.displayName,
      handle,
      active: this.active,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  withProfile(profile: Profile | null) {
    return new Owner({
      did: this.did,
      avatar: profile?.avatar ?? null,
      avatarCid: profile?.avatarCid ?? null,
      description: profile?.description ?? null,
      displayName: profile?.displayName ?? null,
      handle: this.handle,
      active: this.active,
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

export type OwnerView = ReturnType<Owner["toView"]>;
