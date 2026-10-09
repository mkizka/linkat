import { redirect } from "react-router";

import { SettingsPage } from "~/pages/settings-page";
import { di } from "~/server/di";

import type { Route } from "./+types/settings";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const editorDid = await di.sessionService.getSessionDid(request);
  if (!editorDid) {
    throw redirect("/login");
  }
  const editor = await di.ownerService.findOwner(editorDid);
  return { editor: editor.toView() };
};

export default function Index({ loaderData }: Route.ComponentProps) {
  return <SettingsPage editor={loaderData.editor} />;
}
