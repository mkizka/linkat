import { isDid } from "@atproto/did";
import { redirect } from "react-router";

import { getInstance } from "~/i18n/i18n";
import { moderationLevelSchema } from "~/models/moderation";
import { BoardPage, HiddenBoardPage } from "~/pages/board-page";
import { di } from "~/server/di";
import { NotAdminError } from "~/server/service/moderation/moderation";
import { env } from "~/utils/env";
import { createMeta } from "~/utils/meta";

import type { Route } from "./+types/$handle";

const notFound = () => {
  throw new Response("Not Found", { status: 404 });
};

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const viewerDid = await di.sessionService.getSessionDid(request);
  const result = await di.boardService.findBoardView(params.handle, viewerDid);
  if (result.type === "not-found") {
    return notFound();
  }
  if (result.type === "hidden") {
    return { hidden: true as const, status: result.status };
  }
  const { owner, board, moderation } = result;
  const i18next = getInstance(context);
  const title = i18next.t("board.meta-title", {
    displayName: owner.displayName,
    handle: owner.handleOrDid,
  });
  return {
    owner,
    board: { cards: board.cards },
    isMine: owner.did === viewerDid,
    moderation,
    title: `${title} | Linkat`,
    url: `${env.PUBLIC_URL}/${owner.handleOrDid}`,
    ogImageUrl: `${env.PUBLIC_URL}/${owner.handleOrDid}/og`,
    atUri: `at://${owner.did}/blue.linkat.board/self`,
    hidden: false as const,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const adminDid = await di.sessionService.getSessionDid(request);
  const formData = await request.formData();
  const did = formData.get("did");
  const level = moderationLevelSchema
    .nullable()
    .safeParse(formData.get("level") || null);
  if (typeof did !== "string" || !isDid(did) || !level.success) {
    throw new Response("Bad Request", { status: 400 });
  }
  try {
    await di.moderationService.updateLevel(adminDid, did, level.data);
  } catch (error) {
    if (error instanceof NotAdminError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
  return redirect(`/${params.handle}`);
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (loaderData.hidden) {
    return [{ title: "Linkat" }];
  }
  const { title, url, ogImageUrl, atUri } = loaderData;
  return createMeta({ title, url, ogImageUrl, atUri });
};

export default function Index({ loaderData }: Route.ComponentProps) {
  if (loaderData.hidden) {
    return <HiddenBoardPage status={loaderData.status} />;
  }
  const { owner, board, url, isMine, moderation } = loaderData;
  return (
    <BoardPage
      owner={owner}
      board={board}
      url={url}
      isMine={isMine}
      moderation={moderation}
    />
  );
}
