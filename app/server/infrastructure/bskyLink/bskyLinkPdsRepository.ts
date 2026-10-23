import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import link from "~/generated/app/bsky/actor/link";
import profile from "~/generated/app/bsky/actor/profile";
import type { BoardCard } from "~/schemas/board";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

const toLinkRecord = ({ url, text }: BoardCard) =>
  link.parse({
    $type: link.$type,
    url,
    title: text || undefined,
    createdAt: new Date().toISOString(),
  });

const createLinkRecord = async (
  client: Client,
  did: Did,
  record: ReturnType<typeof toLinkRecord>,
  icon: Buffer | null,
) => {
  const blob = icon
    ? (await client.uploadBlob(icon, { encoding: "image/png" })).body.blob
    : undefined;
  return client.createRecord({ ...record, icon: blob }, undefined, {
    repo: did,
  });
};

export class BskyLinkInvalidError extends Error {
  constructor(cause: unknown) {
    super("Blueskyのリンクにできないカードが含まれています", { cause });
  }
}

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

export type BskyLinkInput = {
  card: BoardCard;
  icon: Buffer | null;
};

export interface IBskyLinkPdsRepository {
  replace: (did: Did, links: BskyLinkInput[]) => Promise<void>;
}

export const bskyLinkPdsRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IBskyLinkPdsRepository => ({
  async replace(did, links) {
    const linkRecords = (() => {
      try {
        return links.map(({ card, icon }) => ({
          record: toLinkRecord(card),
          icon,
        }));
      } catch (error) {
        throw new BskyLinkInvalidError(error);
      }
    })();

    const client = new Client(await oauthClient.restore(did));

    const current = await client
      .getRecord(profile.$type, "self", { repo: did })
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
    for (const { record, icon } of linkRecords) {
      const { body } = await createLinkRecord(client, did, record, icon).catch(
        (error: unknown) => {
          throw new BskyLinkExportError(error);
        },
      );
      refs.push({ uri: body.uri, cid: body.cid });
    }

    const nextProfile = profile.safeParse({
      ...current?.value,
      $type: profile.$type,
      links: refs,
    });
    if (!nextProfile.success) {
      throw new BskyLinkInvalidError(nextProfile.reason);
    }

    await client
      .putRecord(nextProfile.value, "self", {
        repo: did,
        swapRecord: current?.cid,
      })
      .catch((error: unknown) => {
        if (isXrpcError(error, "InvalidSwap")) {
          throw new BskyLinkConflictError(error);
        }
        throw new BskyLinkExportError(error);
      });

    const oldLinkPrefix = `at://${did}/${link.$type}/`;
    const oldRkeys = (profile.$ifMatches(current?.value)?.links ?? [])
      .filter(({ uri }) => uri.startsWith(oldLinkPrefix))
      .map(({ uri }) => uri.slice(oldLinkPrefix.length));
    try {
      for (const rkey of oldRkeys) {
        await client.deleteRecord(link.$type, rkey, { repo: did });
      }
    } catch (error) {
      throw new BskyLinkCleanupError(error);
    }
  },
});
