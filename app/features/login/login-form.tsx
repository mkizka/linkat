import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { Form, useNavigation } from "react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "~/components/button";
import { Card } from "~/components/card";

export function LoginForm() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const schema = z.object({
    identifier: z
      .string({ required_error: t("login-form.required-error-message") })
      .refine((value) => value.includes(".") && !value.includes("@"), {
        message: t("login-form.invalid-handle-error-message"),
      }),
  });
  const [form, fields] = useForm({
    id: "login-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  return (
    <Card className="flex w-full max-w-screen-sm flex-row justify-center">
      <Form
        method="post"
        className="card-body flex w-full max-w-sm flex-col gap-4"
        {...getFormProps(form)}
      >
        <h1 className="text-2xl font-bold">{t("login-form.login-title")}</h1>
        <p>{t("login-form.login-description")}</p>
        {form.errors && (
          <div id={form.errorId} className="text-error">
            {form.errors}
          </div>
        )}
        <div className="form-control">
          <div className="join">
            <div className="join-item flex h-full w-12 items-center justify-center rounded-r-full bg-neutral text-neutral-content">
              <AtSymbolIcon className="size-5" />
            </div>
            <input
              className="input join-item input-bordered w-full"
              placeholder="example.bsky.social"
              autoComplete="username"
              data-testid="login-form__identifier"
              {...getInputProps(fields.identifier, { type: "text" })}
            />
          </div>
        </div>
        {fields.identifier.errors && (
          <p className="p-1 text-sm text-error">{fields.identifier.errors}</p>
        )}
        <Button
          type="submit"
          className="btn-bluesky text-base-100"
          loading={navigation.state !== "idle"}
          data-testid="login-form__submit"
        >
          {t("login-form.login-button")}
        </Button>
      </Form>
    </Card>
  );
}
