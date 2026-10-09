import { Main, RootLayout } from "~/components/layout";
import { LoginForm } from "~/features/login/login-form";

export function LoginPage() {
  return (
    <RootLayout>
      <Main className="utils--center">
        <LoginForm />
      </Main>
    </RootLayout>
  );
}
