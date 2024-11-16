import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { BlueskyIcon } from "~/components/icons/bluesky";

const SHARE_MODAL_ID = "share-modal";

type Props = {
  url: string;
};

export function ShareModal({ url }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handledRef = useRef(false);
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const shareText = t("share-modal.share-text", { url });

  useEffect(() => {
    if (searchParams.has("success")) {
      dialogRef.current!.showModal();
      setSearchParams(
        (prev) => {
          prev.delete("success");
          return prev;
        },
        {
          replace: true,
        },
      );
    }
  }, [searchParams, setSearchParams]);

  const trackShareModal = (action: string) => {
    if (!handledRef.current) {
      void umami.track("handle-share-modal", {
        action,
      });
      handledRef.current = true;
    }
  };

  const handlePost = async () => {
    setLoading(true);
    await fetch(`${url}/og`);
    open(
      `https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`,
      "_blank",
      "noreferrer",
    );
    setLoading(false);

    trackShareModal("post-to-bluesky");
  };

  const handleCopy = async () => {
    setCopied(true);
    await navigator.clipboard.writeText(url);
    setTimeout(() => setCopied(false), 3000);

    trackShareModal("copy-url");
  };

  const handleClose = () => {
    trackShareModal("close");
  };

  return (
    <dialog id={SHARE_MODAL_ID} className="modal" ref={dialogRef}>
      <div className="modal-box">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold">{t("share-modal.title")}</h3>
          <p>{t("share-modal.description")}</p>
          <div className="flex flex-col gap-4 py-4 sm:flex-row">
            <Button
              className="btn-bluesky btn flex-1 text-base-100"
              loading={loading}
              onClick={handlePost}
            >
              <BlueskyIcon className="size-6" />
              {t("share-modal.post-to-bluesky")}
            </Button>
            <Button className="flex-1" onClick={handleCopy}>
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
        <form method="dialog">
          <button
            className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
            data-testid="show-modal__close"
            onClick={handleClose}
          >
            ✕
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
