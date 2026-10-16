import type { Did } from "@atproto/did";
import { Client, XrpcResponseError } from "@atproto/lex";
import { z } from "zod";

import type { ValidCard } from "~/models/card";
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

const toLinkRecord = ({ url = "", text }: ValidCard) => {
  const record = {
    $type: linkCollection,
    url,
    createdAt: new Date().toISOString(),
  } as const;
  return text ? { ...record, title: truncateTitle(text) } : record;
};

export interface IBskyLinkPdsRepository {
  replace: (did: Did, cards: ValidCard[]) => Promise<void>;
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
        ({ body }) => body.value,
        (error: unknown) => {
          if (
            error instanceof XrpcResponseError &&
            error.error === "RecordNotFound"
          ) {
            return {};
          }
          throw error;
        },
      );

    const refs = [];
    for (const card of cards) {
      const { body } = await client.createRecord(
        toLinkRecord(card),
        undefined,
        { repo: did },
      );
      refs.push({ uri: body.uri, cid: body.cid });
    }

    await client.putRecord(
      { ...profile, $type: profileCollection, links: refs },
      "self",
      { repo: did },
    );

    const oldLinkPrefix = `at://${did}/${linkCollection}/`;
    const oldRkeys = (profileLinksSchema.safeParse(profile).data?.links ?? [])
      .filter(({ uri }) => uri.startsWith(oldLinkPrefix))
      .map(({ uri }) => uri.slice(oldLinkPrefix.length));
    for (const rkey of oldRkeys) {
      await client.deleteRecord(linkCollection, rkey, { repo: did });
    }
  },
});
