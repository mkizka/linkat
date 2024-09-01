import { Link } from "@remix-run/react";

import { useUser } from "~/atoms/user/hooks";
import { LoginForm } from "~/features/login/login-form";

export default function Index() {
  const user = useUser();
  return (
    <div className="utils--center">
      {user ? (
        <Link
          className="btn btn-primary"
          to={`/edit?base=${user.profile.handle}`}
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
