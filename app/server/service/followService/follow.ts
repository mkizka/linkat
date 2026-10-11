import type { Did } from "@atproto/did";

import type { ProfileView } from "~/generated/app/bsky/actor/defs";
import getFollows from "~/generated/app/bsky/graph/getFollows";
import { LinkatAgent } from "~/libs/agent";
import type { IBoardRepository } from "~/server/infrastructure/boardRepository";
import { env } from "~/utils/env";

const MAX_FOLLOWS = 5000;

const fetchFollows = async (actor: Did) => {
  const agent = LinkatAgent.credential(env.BSKY_PUBLIC_API_URL);
  const follows: ProfileView[] = [];
  let cursor: string | undefined;
  do {
    const response = await agent.call(getFollows, {
      actor,
      limit: 100,
      cursor,
    });
    follows.push(...response.follows);
    cursor = response.cursor;
  } while (cursor && follows.length < MAX_FOLLOWS);
  return follows.slice(0, MAX_FOLLOWS);
};

export type FollowingBoard = {
  did: Did;
  handle: string;
  displayName: string | null;
  avatar: string | null;
  updatedAt: Date;
};

export interface IFollowService {
  findFollowingBoards: (params: {
    userDid: Did;
    limit?: number;
  }) => Promise<FollowingBoard[]>;
}

export const followServiceFactory = ({
  boardRepository,
}: {
  boardRepository: IBoardRepository;
}): IFollowService => ({
  async findFollowingBoards({ userDid, limit }) {
    const follows = new Map(
      (await fetchFollows(userDid)).map((follow) => [follow.did, follow]),
    );
    const boards = await boardRepository.findRecentlyUpdated({
      userDids: [...follows.keys()],
      limit,
    });
    return boards.flatMap(({ userDid, updatedAt }) => {
      const follow = follows.get(userDid);
      if (!follow) {
        return [];
      }
      return {
        did: userDid,
        handle: follow.handle,
        displayName: follow.displayName ?? null,
        avatar: follow.avatar ?? null,
        updatedAt,
      };
    });
  },
});
