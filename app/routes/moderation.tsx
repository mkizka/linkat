import { parseWithZod } from "@conform-to/zod/v4";

import { moderationFormSchema } from "~/features/board/moderation";
import { di } from "~/server/di";
import { requireAdmin } from "~/server/middleware/requireAdmin";
import { requireLogin } from "~/server/middleware/requireLogin";

import type { Route } from "./+types/moderation";

export const middleware: Route.MiddlewareFunction[] = [
  requireLogin,
  requireAdmin,
];

export async function action({ request }: Route.ActionArgs) {
  const submission = parseWithZod(await request.formData(), {
    schema: moderationFormSchema,
  });
  if (submission.status !== "success") {
    throw new Response("Bad Request", { status: 400 });
  }
  const { ownerDid, level } = submission.value;
  await di.moderationRepository.save(ownerDid, level);
  return null;
}
