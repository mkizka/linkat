import { type MiddlewareFunction, redirect } from "react-router";

import { isExperimental } from "~/utils/experimental";

export const requireExperimental: MiddlewareFunction<Response> = async (
  { request },
  next,
) => {
  if (!(await isExperimental(request))) {
    throw redirect("/");
  }
  return next();
};
