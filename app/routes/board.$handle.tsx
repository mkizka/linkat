import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export function loader({ params }: LoaderFunctionArgs) {
  return redirect(`/${params.handle}`);
}
