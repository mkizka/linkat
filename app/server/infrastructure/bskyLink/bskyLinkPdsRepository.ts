import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";

import link, { type Main as LinkRecord } from "~/generated/app/bsky/actor/link";
import profile from "~/generated/app/bsky/actor/profile";
import type { IOAuthClient } from "~/server/infrastructure/auth/oauthClient";

import type { BskyLinkDto } from "./bskyLinkDto";

const createLinkRecord = async (
  client: Client,
  did: Did,
  record: LinkRecord,
  icon: Buffer | null,
) => {
  const blob = icon
    ? (await client.uploadBlob(icon, { encoding: "image/png" })).body.blob
    : undefined;
  return client.createRecord({ ...record, icon: blob }, undefined, {
    repo: did,
  });
};

const MAX_LINKS = 10;

export class BskyLinkInvalidError extends Error {
  constructor(cause: unknown) {
    super("Blueskyのリンクとして書き出せない値です", { cause });
  }
}

const toLinkRecord = ({ url, title }: BskyLinkDto) => {
  const result = link.safeParse({
    $type: link.$type,
    url,
    title,
    createdAt: new Date().toISOString(),
  });
  if (!result.success) {
    throw new BskyLinkInvalidError(result.reason);
  }
  return result.value;
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
  replace: (did: Did, links: BskyLinkDto[]) => Promise<void>;
}

export const bskyLinkPdsRepositoryFactory = ({
  oauthClient,
}: {
  oauthClient: IOAuthClient;
}): IBskyLinkPdsRepository => ({
  async replace(did, links) {
    if (links.length > MAX_LINKS) {
      throw new BskyLinkInvalidError(links.length);
    }
    const records = links.map((dto) => ({
      record: toLinkRecord(dto),
      icon: dto.icon,
    }));
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
    for (const { record, icon } of records) {
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
      throw new BskyLinkExportError(nextProfile.reason);
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
