import { isDid } from "@atproto/did";
import { redirect } from "react-router";

import { moderationLevelSchema } from "~/models/moderation";
import { di } from "~/server/di";
import { NotAdminError } from "~/server/service/moderation/moderation";

import type { Route } from "./+types/moderation";

export async function action({ request }: Route.ActionArgs) {
  const adminDid = await di.sessionService.getSessionDid(request);
  const formData = await request.formData();
  const did = formData.get("did");
  const handle = formData.get("handle");
  const level = moderationLevelSchema
    .nullable()
    .safeParse(formData.get("level") || null);
  if (
    typeof did !== "string" ||
    !isDid(did) ||
    typeof handle !== "string" ||
    !level.success
  ) {
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
  return redirect(`/${encodeURIComponent(handle)}`);
}
