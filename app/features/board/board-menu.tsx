import {
  ArrowUpOnSquareIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  EyeSlashIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type Props = {
  isLogin: boolean;
  onShare: () => void;
  onModerate: (() => void) | null;
};

export function BoardMenu({ isLogin, onShare, onModerate }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const touchStartYRef = useRef(0);
  const { t } = useTranslation();

  const close = () => ref.current?.close();
  const links = isLogin
    ? [
        {
          to: "/settings",
          label: t("board-menu.settings"),
          Icon: Cog6ToothIcon,
        },
        { to: "/", label: t("board-menu.top"), Icon: HomeIcon },
      ]
    : [{ to: "/", label: t("board-menu.top"), Icon: HomeIcon }];
  const itemClass = "flex h-12 items-center gap-3 rounded-box px-4 font-bold";

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
          className="modal-box mx-auto max-w-screen-sm px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-base-content/20" />
          <ul className="menu w-full gap-1 p-0 text-base">
            <li>
              <button
                type="button"
                className={itemClass}
                onClick={() => {
                  close();
                  onShare();
                }}
                data-testid="board-menu__share"
              >
                <ArrowUpOnSquareIcon className="size-6" />
                {t("board-menu.share")}
              </button>
            </li>
            {onModerate && (
              <li>
                <button
                  type="button"
                  className={itemClass}
                  onClick={() => {
                    close();
                    onModerate();
                  }}
                  data-testid="board-menu__moderation"
                >
                  <EyeSlashIcon className="size-6" />
                  {t("moderation.open-button")}
                </button>
              </li>
            )}
            {links.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={itemClass}>
                  <link.Icon className="size-6" />
                  {link.label}
                </Link>
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
