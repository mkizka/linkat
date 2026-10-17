import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";
import { z } from "zod";

import type { BoardCard } from "~/models/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

const linkCollection = "app.bsky.actor.link";
const profileCollection = "app.bsky.actor.profile";

const profileLinksSchema = z.object({
  links: z.object({ uri: z.string() }).array(),
});

const truncateTitle = (text: string) => {
  const graphemes = Array.from(
    new Intl.Segmenter().segment(text),
    ({ segment }) => segment,
  ).slice(0, 40);
  while (new TextEncoder().encode(graphemes.join("")).length > 320) {
    graphemes.pop();
  }
  return graphemes.join("");
};

const toLinkRecord = ({ url = "", text }: BoardCard) => {
  const record = {
    $type: linkCollection,
    url,
    createdAt: new Date().toISOString(),
  } as const;
  return text ? { ...record, title: truncateTitle(text) } : record;
};

export class BskyLinkExportError extends Error {
  constructor(cause: unknown) {
    super("Blueskyへのリンクの書き出しに失敗しました", { cause });
  }
}

export class BskyLinkConflictError extends Error {
  constructor(cause: unknown) {
    super("書き出し中にBlueskyのプロフィールが変更されました", { cause });
  }
}

export class BskyLinkCleanupError extends Error {
  constructor(cause: unknown) {
    super("古いBlueskyのリンクの削除に失敗しました", { cause });
  }
}

const isXrpcError = (error: unknown, name: string) =>
  error instanceof XrpcResponseError && error.error === name;

export interface IBskyLinkPdsRepository {
  replace: (did: Did, cards: BoardCard[]) => Promise<void>;
}

export const bskyLinkPdsRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IBskyLinkPdsRepository => ({
  async replace(did, cards) {
    const client = new Client(await oauthClient.restore(did));

    const profile = await client
      .getRecord(profileCollection, "self", { repo: did })
      .then(
        ({ body }) => body,
        (error: unknown) => {
          if (isXrpcError(error, "RecordNotFound")) {
            return null;
          }
          throw new BskyLinkExportError(error);
        },
      );

    const refs = [];
    for (const card of cards) {
      const { body } = await client
        .createRecord(toLinkRecord(card), undefined, { repo: did })
        .catch((error: unknown) => {
          throw new BskyLinkExportError(error);
        });
      refs.push({ uri: body.uri, cid: body.cid });
    }

    await client
      .putRecord(
        { ...profile?.value, $type: profileCollection, links: refs },
        "self",
        { repo: did, swapRecord: profile?.cid },
      )
      .catch((error: unknown) => {
        if (isXrpcError(error, "InvalidSwap")) {
          throw new BskyLinkConflictError(error);
        }
        throw new BskyLinkExportError(error);
      });

    const oldLinkPrefix = `at://${did}/${linkCollection}/`;
    const oldRkeys = (
      profileLinksSchema.safeParse(profile?.value).data?.links ?? []
    )
      .filter(({ uri }) => uri.startsWith(oldLinkPrefix))
      .map(({ uri }) => uri.slice(oldLinkPrefix.length));
    try {
      for (const rkey of oldRkeys) {
        await client.deleteRecord(linkCollection, rkey, { repo: did });
      }
    } catch (error) {
      throw new BskyLinkCleanupError(error);
    }
  },
});
