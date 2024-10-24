import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { Card } from "~/components/card";
import { Footer, Main } from "~/components/layout";
import { LogoutButton } from "~/components/logout-button";
import { getSessionUserDid } from "~/server/oauth/session";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userDid = await getSessionUserDid(request);
  if (!userDid) {
    return redirect("/login");
  }
  return null;
};

export default function SettingsPage() {
  return (
    <>
      <Main className="py-4">
        <Card>
          <div className="card-body gap-4">
            <Link to="/" className="btn">
              <ChevronLeftIcon className="size-4" />
              トップに戻る
            </Link>
            <h1 className="card-title"># 設定</h1>
            <LogoutButton />
          </div>
        </Card>
      </Main>
      <Footer />
    </>
  );
}
