import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { z } from "zod";

import { useToast } from "~/atoms/toast/hooks";
import { useLogin } from "~/atoms/user/hooks";
import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { Input } from "~/components/input";
import { createLogger } from "~/utils/logger";

import { useLastLoginService } from "./use-last-login-service";

const schema = z.object({
  service: z
    .string({ required_error: "入力してください" })
    .url("URLを入力してください"),
  identifier: z
    .string({ required_error: "入力してください" })
    .regex(/\./, "example.bsky.socialのように入力してください"),
  password: z
    .string({ required_error: "入力してください" })
    .regex(/^[a-z0-9-]+$/, "アプリパスワードしか使用できません"),
});

type Schema = z.infer<typeof schema>;

const logger = createLogger("login-form");

export function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const toast = useToast();

  const [lastLoginService, setLastLoginService] = useLastLoginService();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    defaultValue: { service: lastLoginService },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event, { submission }) => {
      event.preventDefault();
      setIsSubmitting(true);
      const payload = submission?.payload as Schema;
      setLastLoginService(payload.service);
      try {
        await login(payload);
        toast.success("ログインに成功しました");
        navigate(`/edit?base=${payload.identifier}`);
      } catch (e) {
        logger.error("ログインに失敗しました", { e });
        toast.error("ログインに失敗しました");
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Card className="flex w-full max-w-screen-sm flex-row justify-center p-4 pb-8">
      <Form
        method="post"
        className="flex w-full max-w-sm flex-col gap-2"
        {...getFormProps(form)}
      >
        {form.errors && (
          <div id={form.errorId} className="text-error">
            {form.errors}
          </div>
        )}
        <Input
          {...getInputProps(fields.service, { type: "url" })}
          label="サービスURL(分かる人向け)"
          errors={fields.service.errors}
          placeholder="https://bsky.social"
          data-testid="login-form__service"
        />
        <Input
          {...getInputProps(fields.identifier, { type: "text" })}
          label="ハンドル"
          errors={fields.identifier.errors}
          placeholder="example.bsky.social"
          autoComplete="username"
          data-testid="login-form__identifier"
        />
        <Input
          {...getInputProps(fields.password, { type: "password" })}
          label="アプリパスワード"
          errors={fields.password.errors}
          placeholder="xxxx-xxxx-xxxx-xxxx"
          autoComplete="current-password"
          data-testid="login-form__password"
        />
        <Button
          type="submit"
          className="mt-4"
          loading={isSubmitting}
          data-testid="login-form__submit"
        >
          ログイン
        </Button>
      </Form>
    </Card>
  );
}
