import { asDid, type Did } from "@atproto/did";

import type { ProfileViewDetailed } from "~/generated/app/bsky/actor/defs";

const toProfileFields = (profile: ProfileViewDetailed | null) => ({
  avatar: profile?.avatar ?? null,
  description: profile?.description ?? null,
  displayName: profile?.displayName ?? null,
});

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

  isOwnedBy(viewerDid: Did | null) {
    return this.did === viewerDid;
  }

  static create({
    did,
    handle,
    profile,
  }: {
    did: Did;
    handle: string;
    profile: ProfileViewDetailed | null;
  }) {
    return new User({
      did,
      handle,
      ...toProfileFields(profile),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  refresh({
    handle,
    profile,
  }: {
    handle: string;
    profile: ProfileViewDetailed | null;
  }) {
    const profileFields = profile
      ? toProfileFields(profile)
      : {
          avatar: this.avatar,
          description: this.description,
          displayName: this.displayName,
        };
    return new User({
      did: this.did,
      handle,
      ...profileFields,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}
