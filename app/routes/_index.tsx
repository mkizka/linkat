import { useEffect } from "react";
import { useFetcher } from "react-router";

import { getInstance } from "~/i18n/i18n";
import { TopPage } from "~/pages/top-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/_index";
import type { action as syncAction } from "./sync";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  const i18next = getInstance(context);
  const [editor, board, recentOwners] = await Promise.all([
    editorDid ? di.ownerService.findOwnerView(editorDid) : null,
    editorDid ? di.boardService.findBoard(editorDid) : null,
    di.boardService.findRecentOwnerViews(8, editorDid ?? undefined),
  ]);
  return {
    editor,
    hasBoard: !!board,
    recentOwners,
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
  const sync = useFetcher<typeof syncAction>();

  useEffect(() => {
    if (
      loaderData.editor &&
      !loaderData.hasBoard &&
      sync.state === "idle" &&
      !sync.data
    ) {
      void sync.submit(null, { method: "post", action: "/sync" });
    }
  });

  return (
    <TopPage
      editor={loaderData.editor}
      hasBoard={loaderData.hasBoard}
      recentOwners={loaderData.recentOwners}
    />
  );
}
