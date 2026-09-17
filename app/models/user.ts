import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";

const REFETCH_INTERVAL_MS = 10 * 60 * 1000;

export class User {
  readonly did: string;
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
    this.did = props.did;
    this.avatar = props.avatar;
    this.description = props.description;
    this.displayName = props.displayName;
    this.handle = props.handle;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // 最後の取得から10分以上経過していたら再取得する
  shouldRefetch() {
    return this.updatedAt.getTime() <= Date.now() - REFETCH_INTERVAL_MS;
  }

  isOwnedBy(viewerDid: string | null) {
    return this.did === viewerDid;
  }

  static fromProfile(profile: ProfileViewDetailed) {
    return new User({
      did: profile.did,
      avatar: profile.avatar ?? null,
      description: profile.description ?? null,
      displayName: profile.displayName ?? null,
      handle: profile.handle,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  withProfile(profile: ProfileViewDetailed) {
    return new User({
      did: this.did,
      avatar: profile.avatar ?? null,
      description: profile.description ?? null,
      displayName: profile.displayName ?? null,
      handle: profile.handle,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
