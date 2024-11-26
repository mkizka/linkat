import { redirect } from "react-router";

import type { Route } from "./+types/board.$handle";

export function loader({ params }: Route.LoaderArgs) {
  return redirect(`/${params.handle}`);
}
