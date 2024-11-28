import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { LRUCache } from "lru-cache";
import markdownit from "markdown-it";
import { z } from "zod";

import { Footer, Main } from "~/components/layout";
import { LinkatAgent } from "~/libs/agent";

import type { Route } from "./+types/about";

const cache = new LRUCache<string, string>({
  max: 1,
  ttl: 1000 * 60 * 10, // 1 hour
});

const whtwndSchema = z.object({
  content: z.string(),
});

const md = markdownit();

export const loader = async () => {
  const cachedHtml = cache.get("html");
  if (cachedHtml) {
    return { html: cachedHtml };
  }
  const agent = LinkatAgent.credential(
    "https://enoki.us-east.host.bsky.network",
  );
  const response = await agent.com.atproto.repo.getRecord({
    repo: "mkizka.dev",
    collection: "com.whtwnd.blog.entry",
    rkey: "3l6sg24zov62s",
  });
  const whtwnd = whtwndSchema.parse(response.data.value);
  const html = md.render(whtwnd.content);
  cache.set("html", html);
  return { html };
};

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { html } = loaderData;
  return (
    <>
      <header>
        <ChevronLeftIcon className="size-8" />
        戻る
      </header>
      <Main className="py-12">
        <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </Main>
      <Footer />
    </>
  );
}
