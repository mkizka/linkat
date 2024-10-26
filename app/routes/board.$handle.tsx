import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export function loader({ params }: LoaderFunctionArgs) {
  return redirect(`/${params.handle}`);
}
