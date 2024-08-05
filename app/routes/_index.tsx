import { ClientOnly } from "remix-utils/client-only";

import { Sortable } from "~/components/sortable";

export default function Index() {
  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      {() => <Sortable />}
    </ClientOnly>
  );
}
