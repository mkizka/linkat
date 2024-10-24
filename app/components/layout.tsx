import { Cog8ToothIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { Form, Link } from "@remix-run/react";
import { type ReactNode, useRef } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "~/utils/cn";

type HeaderProps = {
  isLogin?: boolean;
};

export function Header({ isLogin }: HeaderProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const handleClick = () => {
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };
  return (
    <header className="relative mx-auto w-full max-w-screen-sm">
      <div className="absolute left-4 top-4">
        <Link to="/" className="text-3xl font-bold">
          Linkat
        </Link>
      </div>
      <div className="absolute right-2 top-2 flex gap-1">
        <details
          className="dropdown dropdown-end"
          ref={detailsRef}
          onClick={(event) => {
            if ((event.target as HTMLElement).tagName === "BUTTON") return;
            void umami.track("click-header-lang", {
              action: "open",
            });
          }}
        >
          <summary className="btn btn-square m-1 shadow dark:btn-neutral light:bg-white">
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
        {isLogin && (
          <Link
            to="/settings"
            className="btn btn-square m-1 shadow dark:btn-neutral light:bg-white"
          >
            <Cog8ToothIcon className="size-6" />
          </Link>
        )}
      </div>
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

type FooterProps = {
  withNavigation?: boolean;
};

export function Footer({ withNavigation }: FooterProps) {
  const { t } = useTranslation();
  return (
    <footer className="mx-auto flex w-full max-w-screen-sm flex-col gap-2 bg-neutral py-4 text-center text-neutral-content">
      {withNavigation && (
        <nav>
          <Link
            to="/"
            className="hover:underline"
            data-umami-event="click-footer-top-link"
          >
            {t("layout.footer-message")}
          </Link>
        </nav>
      )}
      <aside className="flex h-8 flex-col justify-center">
        <p>
          GitHub:
          <a
            href="https://github.com/mkizka/linkat"
            className="ml-1 hover:underline"
            target="_blank"
            rel="noreferrer"
            data-umami-event="click-footer-github-link"
          >
            mkizka/linkat
          </a>
        </p>
      </aside>
    </footer>
  );
}

type RootLayoutProps = {
  isLogin?: boolean;
  children: ReactNode;
};

export function RootLayout({ isLogin, children }: RootLayoutProps) {
  return (
    <>
      <Header isLogin={isLogin} />
      {children}
      <Footer />
    </>
  );
}
