import { AtUri } from "@atproto/api";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { LRUCache } from "lru-cache";
import markdownit from "markdown-it";
import linkAttributes from "markdown-it-link-attributes";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { z } from "zod";

import { Footer, Main } from "~/components/layout";
import { i18nServer } from "~/i18n/i18n";
import { LinkatAgent } from "~/libs/agent";
import { env } from "~/utils/env";

import type { Route } from "./+types/about";

type About = {
  title: string;
  content: string;
};

const cache = new LRUCache<string, About>({
  max: 1,
  ttl: 1000 * 60 * 10,
});

const whtwndSchema = z.object({
  title: z.string(),
  content: z.string(),
});

const md = markdownit().use(linkAttributes, {
  attrs: {
    target: "_blank",
    rel: "noopener noreferrer",
  },
});

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
  const atUri = new AtUri(
    `at://${env.ABOUT_WHTWND_REPO}/com.whtwnd.blog.entry/${getRkey(locale)}`,
  );
  const cachedAbout = cache.get(atUri.toString());
  if (cachedAbout) {
    return {
      atUri: atUri.toString(),
      about: cachedAbout,
    };
  }
  const agent = LinkatAgent.credential(env.ABOUT_WHTWND_PDS_URL);
  const response = await agent.com.atproto.repo.getRecord({
    repo: atUri.host,
    collection: atUri.collection,
    rkey: atUri.rkey,
  });
  const whtwnd = whtwndSchema.parse(response.data.value);
  const about = {
    title: whtwnd.title,
    content: md.render(whtwnd.content),
  };
  cache.set(atUri.toString(), about);
  return {
    atUri: atUri.toString(),
    about,
  };
};

export const meta: Route.MetaFunction = ({ data }) => {
  const { about, atUri } = data;

  return [
    { title: about.title },
    {
      tagName: "link",
      rel: "alternate",
      href: atUri,
    },
  ];
};

export default function AboutPage({ loaderData }: Route.ComponentProps) {
  const { t } = useTranslation();
  const { about } = loaderData;
  return (
    <>
      <Main className="py-2">
        <Link to="/" className="flex h-8 items-center underline">
          <ChevronLeftIcon className="size-6" />
          {t("about.back-to-top")}
        </Link>
        <article className="prose py-6">
          <h1 className="text-3xl">{about.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: about.content }} />
        </article>
      </Main>
      <Footer />
    </>
  );
}
