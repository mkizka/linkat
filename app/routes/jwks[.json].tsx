import { di } from "~/server/di";

export function loader() {
  return Response.json(di.authService.getJwks());
}
