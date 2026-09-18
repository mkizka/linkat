import { AtPassport, AtPassportIcon, AtPassportUI } from "@atpassport/client";
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
  const handleInputRef = useRef<HTMLInputElement>(null);
  const atpassportLang = i18n.language === "ja" ? "ja" : "en";

  const schema = z.object({
    handle: z
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
      lang: atpassportLang,
      fedcm: true,
    });
    const result = await atpassport.requestHandleAssist({
      targetInput: handleInputRef.current ?? undefined,
      // FedCM未対応ブラウザではサーバー側のリダイレクトフローにフォールバックする
      fallback: () => {
        window.location.href = "/login/atpassport";
        return null;
      },
    });
    if (result) {
      void submit({ handle: result.username }, { method: "post" });
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
        <div className="flex flex-col">
          <div className="join">
            <div className="join-item flex w-12 items-center justify-center rounded-r-full bg-neutral text-neutral-content">
              <AtSymbolIcon className="size-5" />
            </div>
            <input
              ref={handleInputRef}
              className="input join-item w-full"
              placeholder="example.bsky.social"
              autoComplete="username"
              data-testid="login-form__handle"
              {...getInputProps(fields.handle, { type: "text" })}
              // @passportブラウザ拡張機能がhandle入力欄を認識するための属性
              id="handle"
            />
          </div>
        </div>
        {fields.handle.errors && (
          <p className="whitespace-pre-line p-1 text-sm text-error">
            {fields.handle.errors}
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
        <div className="divider text-sm my-0">{t("login-form.or-divider")}</div>
        <Button
          type="button"
          className="bg-base-300"
          onClick={() => void handleAtpassportClick()}
          data-testid="login-form__atpassport"
        >
          <AtPassportIcon size={20} />
          {AtPassportUI[atpassportLang].title}
        </Button>
        <p className="text-center text-sm text-base-content/70">
          {t("login-form.atpassport-description")}
          <br />
          <a
            href="https://atpassport.net/about"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            {t("login-form.atpassport-link")}
          </a>
        </p>
      </Form>
    </Card>
  );
}
