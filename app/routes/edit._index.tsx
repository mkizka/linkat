import { type ClientLoaderFunction, redirect } from "@remix-run/react";
import { getDefaultStore } from "jotai";

import { userAtom } from "~/atoms/user/base";
import { BoardEditor } from "~/features/edit/board-editor";

export const clientLoader: ClientLoaderFunction = () => {
  const store = getDefaultStore();
  const user = store.get(userAtom);
  if (!user) {
    return redirect("/");
  }
  return null;
};

export default function Index() {
  return <BoardEditor />;
}
