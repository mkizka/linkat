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

const uploadIcon = async (client: Client, url: string) => {
  try {
    const response = await fetch(
      `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!response.ok || response.headers.get("content-type") !== "image/png") {
      return undefined;
    }
    const { body } = await client.uploadBlob(await response.bytes(), {
      encoding: "image/png",
    });
    return body.blob;
  } catch {
    return undefined;
  }
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

export interface IBskyLinkPdsRepository {
  replace: (did: Did, cards: BoardCard[]) => Promise<void>;
}

export const bskyLinkPdsRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IBskyLinkPdsRepository => ({
  async replace(did, cards) {
    const linkRecords = (() => {
      try {
        return cards.map(toLinkRecord);
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
    for (const record of linkRecords) {
      const icon = await uploadIcon(client, record.url);
      const { body } = await client
        .createRecord({ ...record, icon }, undefined, { repo: did })
        .catch((error: unknown) => {
          throw new BskyLinkExportError(error);
        });
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
