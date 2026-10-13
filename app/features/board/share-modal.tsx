import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import { type Ref, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/button";
import { BlueskyIcon } from "~/components/icons/bluesky";
import { useUmami } from "~/hooks/useUmami";

type Props = {
  ref: Ref<HTMLDialogElement>;
  url: string;
  title: string;
  shareText: string;
};

export function ShareModal({ ref, url, title, shareText }: Props) {
  const handledRef = useRef(false);
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const umami = useUmami();

  const trackShareModal = (action: string) => {
    if (!handledRef.current) {
      umami.track("handle-share-modal", {
        action,
      });
      handledRef.current = true;
    }
  };

  const handlePost = async () => {
    setLoading(true);
    await fetch(`${url}/og`).catch(() => undefined);
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
    <dialog className="modal" ref={ref}>
      <div className="modal-box">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-bold">{title}</h3>
          <p>{t("share-modal.description")}</p>
          <div className="flex flex-col gap-4 py-4 sm:flex-row">
            <Button
              className="btn-bluesky btn h-auto flex-1 py-3 text-white"
              loading={loading}
              onClick={handlePost}
            >
              <BlueskyIcon className="size-6" />
              {t("share-modal.post-to-bluesky")}
            </Button>
            <Button className="h-auto flex-1 py-3" onClick={handleCopy}>
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
