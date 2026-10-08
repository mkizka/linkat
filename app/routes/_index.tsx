import { TopPage } from "~/features/top/top-page";
import { getInstance } from "~/i18n/i18n";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/_index";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  const i18next = getInstance(context);
  return {
    isLogin: !!editorDid,
    title: i18next.t("_index.meta-title"),
    description: i18next.t("_index.meta-description"),
    url: env.PUBLIC_URL,
  };
};

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const { title, description, url } = loaderData;
  return createMeta({ title, description, url });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  return <TopPage isLogin={loaderData.isLogin} />;
}
