import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

import { cn } from "~/utils/cn";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function Header() {
  return (
    <header className="relative mx-auto w-full max-w-screen-sm">
      <div className="absolute left-4 top-4">
        <Link to="/" className="text-3xl font-bold">
          Linkat
        </Link>
      </div>
    </header>
  );
}

export function Main({ className, children }: Props) {
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
  return (
    <footer className="mx-auto flex w-full max-w-screen-sm flex-col gap-2 bg-neutral py-4 text-center text-neutral-content">
      {withNavigation && (
        <nav>
          <Link to="/">
            <span className="mx-2 text-xl font-bold underline">Linkat</span>
            でリンク集を作ろう
          </Link>
        </nav>
      )}
      <aside>
        <p>© {new Date().getFullYear()} Linkat</p>
      </aside>
    </footer>
  );
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
