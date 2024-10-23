import { type LoaderFunctionArgs, redirect } from "@remix-run/node";

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
      <Main>
        <Card>
          <div className="card-body">
            <LogoutButton />
          </div>
        </Card>
      </Main>
      <Footer />
    </>
  );
}
