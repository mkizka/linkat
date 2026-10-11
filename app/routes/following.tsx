import { redirect } from "react-router";

import { FollowingPage } from "~/pages/following-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";

import type { Route } from "./+types/following";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  const boards = await di.followingService.findFollowingBoards({ editorDid });
  return {
    boards: boards instanceof Error ? null : boards,
    url: env.PUBLIC_URL,
    now: new Date(),
  };
};

export default function Index({ loaderData }: Route.ComponentProps) {
  return <FollowingPage {...loaderData} />;
}
