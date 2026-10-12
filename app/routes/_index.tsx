import { getInstance } from "~/i18n/i18n";
import { TopPage } from "~/pages/top-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/_index";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  const i18next = getInstance(context);
  return {
    editor: editorDid ? await di.ownerService.findOwnerView(editorDid) : null,
    hasBoard: editorDid
      ? !!(await di.boardService.findBoard(editorDid))
      : false,
    recentOwners: await di.boardService.findRecentOwnerViews(8),
    sampleUrl: `${env.PUBLIC_URL}/sample`,
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
  return (
    <TopPage
      editor={loaderData.editor}
      hasBoard={loaderData.hasBoard}
      recentOwners={loaderData.recentOwners}
      sampleUrl={loaderData.sampleUrl}
    />
  );
}
