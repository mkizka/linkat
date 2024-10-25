import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";

import { BlueskyIcon } from "./card/icons/bluesky";

const SHARE_MODAL_ID = "share-modal";

type Props = {
  url: string;
};

export function ShareModal({ url }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (searchParams.has("success")) {
      ref.current!.showModal();
      // setSearchParams(
      //   (prev) => {
      //     prev.delete("success");
      //     return prev;
      //   },
      //   {
      //     replace: true,
      //   },
      // );
    }
  }, [searchParams, setSearchParams]);

  const handleCopy = async () => {
    setCopied(true);
    await navigator.clipboard.writeText(url);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <dialog id={SHARE_MODAL_ID} className="modal" ref={ref}>
      <div className="modal-box">
        <h3 className="text-lg font-bold">{t("share-modal.title")}</h3>
        <p>{t("share-modal.description")}</p>
        <div className="flex flex-col gap-2 py-4 sm:flex-row">
          <a
            className="btn-bluesky btn flex-1 text-base-100"
            href={`https://bsky.app/intent/compose?text=${encodeURIComponent(t("share-modal.share-text", { url }))}`}
            target="_blank"
            rel="noreferrer"
          >
            <BlueskyIcon className="size-6" />
            {t("share-modal.post-to-bluesky")}
          </a>
          <Button onClick={handleCopy} className="flex-1">
            {copied ? (
              <ClipboardDocumentCheckIcon className="size-6" />
            ) : (
              <ClipboardIcon className="size-6" />
            )}
            {copied
              ? t("share-modal.copied-message")
              : t("share-modal.copy-url")}
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button data-testid="share-modal__close">close</button>
      </form>
    </dialog>
  );
}
