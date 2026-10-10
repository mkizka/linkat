import { asDid, type Did } from "@atproto/did";

export type AccountState = { active: boolean; status: string | null };

export type Profile = {
  avatarCid: string | null;
  description: string | null;
  displayName: string | null;
};

export class Owner {
  readonly did: Did;
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
    this.avatarCid = props.avatarCid;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.active = props.active;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static viewFromDid(did: Did): OwnerView {
    return {
      did,
      handleOrDid: did,
      displayHandle: `@${did}`,
      displayName: null,
      avatarUrl: null,
    };
  }

  isHidden() {
    return !this.active;
  }

  toView() {
    return {
      did: this.did,
      handleOrDid: this.handle ?? this.did,
      displayHandle: `@${this.handle ?? this.did}`,
      displayName: this.displayName,
      avatarUrl: this.avatarCid
        ? `https://cdn.bsky.app/img/avatar/plain/${this.did}/${this.avatarCid}@jpeg`
        : null,
    };
  }
}

export type OwnerView = ReturnType<Owner["toView"]>;
