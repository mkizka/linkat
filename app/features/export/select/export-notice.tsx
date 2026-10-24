import type { Ref } from "react";
import { useTranslation } from "react-i18next";

const items = [
  "export.notice-max",
  "export.notice-replace",
  "export.notice-no-sync",
  "export.notice-format",
  "export.notice-no-url",
  "export.notice-bsky-rules",
] as const;

type Props = {
  ref: Ref<HTMLDialogElement>;
};

export function ExportNotice({ ref }: Props) {
  const { t } = useTranslation();
  return (
    <dialog className="modal" ref={ref} data-testid="export-notice">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{t("export.notice-link")}</h3>
        <ul className="list-disc space-y-2 pt-3 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
        <form method="dialog" className="mt-4">
          <button className="btn w-full">{t("export.notice-close")}</button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
