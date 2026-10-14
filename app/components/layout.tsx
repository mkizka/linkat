import { LanguageIcon } from "@heroicons/react/24/outline";
import { type ReactNode, useRef } from "react";
import GitHubButton from "react-github-btn";
import { useTranslation } from "react-i18next";
import { Form, Link } from "react-router";

import { useUmami } from "~/hooks/useUmami";
import { cn } from "~/utils/cn";

import { BlueskyIcon } from "./icons/bluesky";
import { GitHubIcon } from "./icons/github";

export function Header() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const umami = useUmami();
  const handleClick = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };
  return (
    <header className="mx-auto flex w-full max-w-screen-sm items-center justify-between bg-base-200 px-4 pt-2">
      <Link to="/" className="text-xl font-bold">
        Linkat
      </Link>
      <details
        className="dropdown dropdown-end"
        ref={detailsRef}
        onClick={(event) => {
          if (
            event.target instanceof HTMLElement &&
            event.target.tagName === "BUTTON"
          ) {
            return;
          }
          umami.track("click-header-lang", {
            action: "open",
          });
        }}
      >
        <summary className="btn btn-square btn-sm shadow dark:btn-neutral light:bg-white">
          <LanguageIcon className="size-6" />
        </summary>
        <Form>
          <ul className="menu dropdown-content z-[1] w-52 rounded-box p-2 shadow light:bg-white dark:bg-neutral">
            <li>
              <button
                type="submit"
                name="lng"
                value="ja"
                onClick={handleClick}
                data-umami-event="click-header-lang"
                data-umami-event-action="select-ja"
              >
                日本語
              </button>
            </li>
            <li>
              <button
                type="submit"
                name="lng"
                value="en"
                onClick={handleClick}
                data-umami-event="click-header-lang"
                data-umami-event-action="select-en"
              >
                English
              </button>
            </li>
          </ul>
        </Form>
      </details>
    </header>
  );
}

type MainProps = {
  className?: string;
  children?: ReactNode;
};

export function Main({ className, children }: MainProps) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-screen-sm flex-1 bg-base-200 px-4",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto w-full max-w-screen-sm bg-base-200 px-4">
      <nav className="flex flex-col items-center gap-2 border-t border-base-300 pb-8 pt-4 text-sm text-base-content/70">
        <div className="flex items-center gap-4">
          <a
            href="https://bsky.app/profile/linkat.blue"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline"
            data-umami-event="click-footer-bsky-link"
          >
            <BlueskyIcon className="size-4" aria-hidden />
            Bluesky
          </a>
          <a
            href="https://github.com/mkizka/linkat"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline"
            data-umami-event="click-footer-github-link"
          >
            <GitHubIcon className="size-4" aria-hidden />
            GitHub
          </a>
          <div className="relative h-5 w-14">
            <div className="loading loading-spinner absolute size-4"></div>
            <div className="absolute">
              <GitHubButton
                href="https://github.com/mkizka/linkat"
                data-color-scheme="no-preference: light; light: light; dark: dark;"
                data-icon="octicon-star"
                data-show-count="true"
                aria-label="Star mkizka/linkat on GitHub"
              />
            </div>
          </div>
        </div>
        <Link
          to="/about"
          className="underline"
          data-umami-event="click-footer-about-link"
        >
          {t("layout.about-link")}
        </Link>
      </nav>
    </footer>
  );
}

type RootLayoutProps = {
  children: ReactNode;
};

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
