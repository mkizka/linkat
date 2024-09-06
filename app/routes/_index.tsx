import type { ClientLoaderFunction } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { getDefaultStore } from "jotai";

import { useUser } from "~/atoms/user/hooks";
import { resumeSessionAtom } from "~/atoms/user/write-only";
import { LoginForm } from "~/features/login/login-form";

export const clientLoader: ClientLoaderFunction = async () => {
  const store = getDefaultStore();
  await store.set(resumeSessionAtom);
  return null;
};

export default function Index() {
  const user = useUser();
  return (
    <div className="utils--center">
      {user ? (
        <Link
          className="btn btn-neutral"
          to="/edit"
          data-testid="index__edit-link"
        >
          編集ページへ
        </Link>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
