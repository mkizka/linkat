export function loader() {
  throw new Response("Not Found", { status: 404 });
}
