import { redirect } from "react-router";

import { SettingsPage } from "~/pages/settings-page";
import { di } from "~/server/di";
import {
  editorDidContext,
  requireLogin,
} from "~/server/middleware/requireLogin";

import type { Route } from "./+types/settings";

export const middleware: Route.MiddlewareFunction[] = [requireLogin];

export const loader = async ({ context }: Route.LoaderArgs) => {
  const editorDid = context.get(editorDidContext);
  const editor = await di.ownerService.findEditorView(editorDid);
  if (!editor.synced) {
    throw redirect("/");
  }
  return { editor };
};

export default function Index({ loaderData }: Route.ComponentProps) {
  return <SettingsPage editor={loaderData.editor} />;
}
