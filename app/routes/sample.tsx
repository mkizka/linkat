import { SamplePage } from "~/features/sample/sample-page";
import { env } from "~/utils/env";

import type { Route } from "./+types/sample";

export function loader() {
  return {
    url: `${env.PUBLIC_URL}/sample`,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return <SamplePage url={loaderData.url} />;
}
