import { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Form, useNavigation } from "react-router";

import { Button } from "~/components/button";
import type { ModerationLevel } from "~/models/moderation";
import { cn } from "~/utils/cn";

type Props = {
  ownerDid: string;
  handle: string;
  level: ModerationLevel | null;
  children: ReactNode;
};

const options = [
  { value: "", label: "moderation.level-none" },
  { value: "unlisted", label: "moderation.level-unlisted" },
  { value: "hidden", label: "moderation.level-hidden" },
] as const;

function ModerationBanner({
  level,
  onChange,
}: {
  level: ModerationLevel | null;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  if (!level) {
    return null;
  }
  return (
    <div
      role="alert"
      className={cn(
        "alert mt-4 flex justify-between text-start",
        level === "hidden" ? "alert-error" : "alert-warning",
      )}
      data-testid="moderation-banner"
    >
      <span>{t(`moderation.banner-${level}`)}</span>
      <button className="btn btn-ghost btn-sm" onClick={onChange}>
        {t("moderation.change-button")}
      </button>
    </div>
  );
}

export function ModerationPanel({ ownerDid, handle, level, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  const navigation = useNavigation();
  const open = () => dialogRef.current?.showModal();

  return (
    <>
      <ModerationBanner level={level} onChange={open} />
      {children}
      <button
        className="btn btn-ghost btn-sm mb-4 self-center"
        onClick={open}
        data-testid="moderation-panel__open"
      >
        {t("moderation.open-button")}
      </button>
      <dialog className="modal" ref={dialogRef}>
        <div className="modal-box">
          <Form
            method="post"
            action="/moderation"
            className="flex flex-col gap-2"
            onSubmit={() => dialogRef.current?.close()}
          >
            <h3 className="text-lg font-bold">{t("moderation.title")}</h3>
            <input type="hidden" name="ownerDid" value={ownerDid} />
            <input type="hidden" name="handle" value={handle} />
            {options.map((option) => (
              <label
                key={option.value}
                className="label cursor-pointer justify-start gap-2"
              >
                <input
                  type="radio"
                  name="level"
                  value={option.value}
                  defaultChecked={(level ?? "") === option.value}
                  className="radio"
                />
                <span>{t(option.label)}</span>
              </label>
            ))}
            <Button
              className="btn-primary mt-2"
              loading={navigation.state !== "idle"}
            >
              {t("moderation.save-button")}
            </Button>
          </Form>
          <form method="dialog">
            <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">
              ✕
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
