// https://github.com/remix-run/remix/issues/9209#issuecomment-2043606136
export function loader() {
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw new Response("Not Found", { status: 404 });
}

export default function Component() {
  return null;
}
