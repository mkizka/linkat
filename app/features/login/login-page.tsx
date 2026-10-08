import { Main, RootLayout } from "~/components/layout";

import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <RootLayout>
      <Main className="utils--center">
        <LoginForm />
      </Main>
    </RootLayout>
  );
}
