import { SamplePage } from "~/pages/sample-page";
import { di } from "~/server/di";
import { env } from "~/utils/env";

import type { Route } from "./+types/sample";

export async function loader({ request }: Route.LoaderArgs) {
  const viewerDid = await di.sessionService.getSessionDid(request);
  return {
    url: `${env.PUBLIC_URL}/sample`,
    isLogin: viewerDid !== null,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return <SamplePage {...loaderData} />;
}
