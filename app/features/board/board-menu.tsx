import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  isLogin: boolean;
  onShare: () => void;
};

export function BoardMenu({ isLogin, onShare }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchStartYRef = useRef(0);
  const { t } = useTranslation();

  const close = () => ref.current?.close();
  const links = isLogin
    ? [
        { to: "/following", label: t("board-menu.following") },
        { to: "/settings", label: t("board-menu.settings") },
        { to: "/", label: t("board-menu.top") },
      ]
    : [{ to: "/", label: t("board-menu.top") }];

  return (
    <>
      <button
        type="button"
        className="btn btn-square"
        aria-label={t("board-menu.menu")}
        onClick={() => ref.current?.showModal()}
        data-testid="board-menu__menu"
      >
        <EllipsisHorizontalIcon className="size-6" />
      </button>
      <dialog className="modal modal-bottom" ref={ref}>
        <div
          className="modal-box mx-auto max-w-screen-sm px-4 pt-3"
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0]?.clientY ?? 0;
          }}
          onTouchEnd={(e) => {
            if (
              (e.changedTouches[0]?.clientY ?? 0) - touchStartYRef.current >
              50
            ) {
              close();
            }
          }}
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-base-300" />
          <ul className="menu w-full text-base">
            <li>
              <button
                type="button"
                onClick={() => {
                  close();
                  onShare();
                }}
                data-testid="board-menu__share"
              >
                {t("board-menu.share")}
              </button>
            </li>
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
