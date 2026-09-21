import { authService } from "~/server/service/authService";

export function loader() {
  return Response.json(authService.getJwks());
}
