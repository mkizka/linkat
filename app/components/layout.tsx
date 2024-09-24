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
        "mx-auto w-full max-w-screen-sm flex-1 bg-base-200 p-4",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function Footer({ className, children }: Props) {
  return (
    <footer
      className={cn(
        "footer footer-center mx-auto max-w-screen-sm items-center bg-neutral p-4 text-neutral-content",
        className,
      )}
    >
      {children}
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
