import { LanguageIcon } from "@heroicons/react/24/outline";
import { type ReactNode } from "react";
import GitHubButton from "react-github-btn";
import { useTranslation } from "react-i18next";
import { Form, Link } from "react-router";

import { cn } from "~/utils/cn";

import { BlueskyIcon } from "./icons/bluesky";
import { GitHubIcon } from "./icons/github";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-screen-sm items-center bg-base-200 px-4 pt-2">
      <Link to="/" className="text-xl font-bold">
        Linkat
      </Link>
    </header>
  );
}

const languages = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

function LanguageMenu() {
  const { i18n } = useTranslation();
  return (
    <div className="dropdown dropdown-top dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-outline btn-xs gap-1 border-base-content/30 text-sm font-normal text-base-content/70"
        data-umami-event="click-footer-lang"
        data-umami-event-action="open"
      >
        <LanguageIcon className="size-4" aria-hidden />
        {i18n.language === "en" ? "English" : "日本語"}
      </div>
      <Form>
        <ul
          tabIndex={0}
          className="menu dropdown-content z-[1] mb-2 w-40 rounded-box p-2 shadow light:bg-white dark:bg-neutral"
        >
          {languages.map(({ value, label }) => (
            <li key={value}>
              <button
                type="submit"
                name="lng"
                value={value}
                onClick={(event) => event.currentTarget.blur()}
                data-umami-event="click-footer-lang"
                data-umami-event-action={`select-${value}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </Form>
    </div>
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
        <div className="flex items-center gap-4">
          <Link
            to="/about"
            className="underline"
            data-umami-event="click-footer-about-link"
          >
            {t("layout.about-link")}
          </Link>
          <LanguageMenu />
        </div>
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
