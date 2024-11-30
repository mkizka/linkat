import { LRUCache } from "lru-cache";
import markdownit from "markdown-it";
import { z } from "zod";

import { Footer, Main } from "~/components/layout";
import { i18nServer } from "~/i18n/i18n";
import { LinkatAgent } from "~/libs/agent";
import { env } from "~/utils/env";

import type { Route } from "./+types/about";

const cache = new LRUCache<string, string>({
  max: 1,
  ttl: 1000 * 60 * 10,
});

const whtwndSchema = z.object({
  content: z.string(),
});

const md = markdownit();

const getRkey = (locale: string) => {
  switch (locale) {
    case "ja":
      return env.ABOUT_WHTWND_RKEY_JA;
    case "en":
      return env.ABOUT_WHTWND_RKEY_EN;
    default:
      return env.ABOUT_WHTWND_RKEY_EN;
  }
};

export const loader = async ({ request }: Route.LoaderArgs) => {
  const locale = await i18nServer.getLocale(request);
  const key = `about-${locale}`;
  const cachedContent = cache.get(key);
  if (cachedContent) {
    return { content: cachedContent };
  }
  const agent = LinkatAgent.credential(env.ABOUT_WHTWND_PDS_URL);
  const response = await agent.com.atproto.repo.getRecord({
    repo: env.ABOUT_WHTWND_REPO,
    collection: "com.whtwnd.blog.entry",
    rkey: getRkey(locale),
  });
  const whtwnd = whtwndSchema.parse(response.data.value);
  const content = md.render(whtwnd.content);
  cache.set(key, content);
  return { content };
};

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { content } = loaderData;
  return (
    <>
      <Main className="py-8">
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Main>
      <Footer />
    </>
  );
}
