import { parseWithZod } from "@conform-to/zod/v4";

import { moderationFormSchema } from "~/features/board/moderation-panel";
import { di } from "~/server/di";
import { NotAdminError } from "~/server/service/moderation/moderation";

import type { Route } from "./+types/moderation";

export async function action({ request }: Route.ActionArgs) {
  const editorDid = await di.sessionService.getSessionDid(request);
  const submission = parseWithZod(await request.formData(), {
    schema: moderationFormSchema,
  });
  if (submission.status !== "success") {
    throw new Response("Bad Request", { status: 400 });
  }
  const { ownerDid, level } = submission.value;
  try {
    await di.moderationService.updateLevel(editorDid, ownerDid, level);
  } catch (error) {
    if (error instanceof NotAdminError) {
      throw new Response("Forbidden", { status: 403 });
    }
    throw error;
  }
  return null;
}
