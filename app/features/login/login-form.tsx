import { AtPassport } from "@atpassport/client/core";
import { ensureValidHandle } from "@atproto/syntax";
import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { AtSymbolIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation, useSubmit } from "react-router";
import { z } from "zod";

import { Button } from "~/components/button";
import { Card } from "~/components/card";

const isValidHandle = (value: string) => {
  try {
    ensureValidHandle(value);
    return true;
  } catch {
    return false;
  }
};

export function LoginForm() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const submit = useSubmit();
  const identifierInputRef = useRef<HTMLInputElement>(null);

  const schema = z.object({
    identifier: z
      .string({ message: t("login-form.required-error-message") })
      .refine(isValidHandle, {
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

  const handleAtpassportClick = async () => {
    const atpassport = new AtPassport({
      callbackUrl: `${window.location.origin}/login/atpassport/callback`,
      lang: i18n.language === "ja" ? "ja" : "en",
      fedcm: true,
    });
    const result = await atpassport.requestHandleAssist({
      targetInput: identifierInputRef.current ?? undefined,
      // FedCM未対応ブラウザではサーバー側のリダイレクトフローにフォールバックする
      fallback: () => {
        window.location.href = "/login/atpassport";
        return null;
      },
    });
    if (result) {
      void submit({ identifier: result.username }, { method: "post" });
    }
  };

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
            <div className="join-item flex w-12 items-center justify-center rounded-r-full bg-neutral text-neutral-content">
              <AtSymbolIcon className="size-5" />
            </div>
            <input
              ref={identifierInputRef}
              className="input join-item input-bordered w-full"
              placeholder="example.bsky.social"
              autoComplete="username"
              data-testid="login-form__identifier"
              {...getInputProps(fields.identifier, { type: "text" })}
            />
          </div>
        </div>
        {fields.identifier.errors && (
          <p className="whitespace-pre-line p-1 text-sm text-error">
            {fields.identifier.errors}
          </p>
        )}
        <Button
          type="submit"
          className="btn-bluesky text-blue-100"
          loading={navigation.state !== "idle"}
          data-testid="login-form__submit"
        >
          {t("login-form.login-button")}
        </Button>
        <Button
          type="button"
          className="btn-outline"
          onClick={() => void handleAtpassportClick()}
          data-testid="login-form__atpassport"
        >
          {t("login-form.atpassport-button")}
        </Button>
      </Form>
    </Card>
  );
}
