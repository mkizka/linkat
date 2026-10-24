import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type UmamiTrackFn = (
  eventName: string,
  eventData?: Record<string, unknown>,
) => void;

interface UmamiContextValue {
  track: UmamiTrackFn;
}

const UmamiContext = createContext<UmamiContextValue | null>(null);

// 未設定やブロックでスクリプトが読み込まれない場合に待ち続けないようにする
const MAX_WAIT_MS = 10_000;

export function UmamiProvider({ children }: { children: ReactNode }) {
  const statusRef = useRef<"loading" | "loaded" | "unavailable">("loading");
  const queueRef = useRef<Array<[string, Record<string, unknown>?]>>([]);

  const track: UmamiTrackFn = useCallback((eventName, eventData) => {
    if (statusRef.current === "loaded") {
      void window.umami.track(eventName, eventData);
    } else if (statusRef.current === "loading") {
      queueRef.current.push([eventName, eventData]);
    }
  }, []);

  useEffect(() => {
    const startedAt = Date.now();
    const checkInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (window.umami && "track" in window.umami) {
        statusRef.current = "loaded";
        queueRef.current.forEach(([eventName, eventData]) => {
          void window.umami.track(eventName, eventData);
        });
      } else if (Date.now() - startedAt >= MAX_WAIT_MS) {
        statusRef.current = "unavailable";
      } else {
        return;
      }
      queueRef.current = [];
      clearInterval(checkInterval);
    }, 100);

    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[data-umami-event]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const eventName = anchor.getAttribute("data-umami-event");
      if (
        !eventName ||
        anchor.target === "_blank" ||
        anchor.origin !== location.origin ||
        event.ctrlKey ||
        event.shiftKey ||
        event.metaKey ||
        event.button === 1
      ) {
        return;
      }
      const eventData = Object.fromEntries(
        anchor
          .getAttributeNames()
          .filter((name) => name.startsWith("data-umami-event-"))
          .map((name) => [
            name.slice("data-umami-event-".length),
            anchor.getAttribute(name),
          ]),
      );
      track(eventName, eventData);
      anchor.removeAttribute("data-umami-event");
      // eslint-disable-next-line @eslint-react/web-api-no-leaked-timeout
      setTimeout(() => anchor.setAttribute("data-umami-event", eventName));
    };
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [track]);

  return (
    <UmamiContext.Provider value={{ track }}>{children}</UmamiContext.Provider>
  );
}

export function useUmami() {
  const context = useContext(UmamiContext);
  if (!context) {
    throw new Error("useUmami must be used within UmamiProvider");
  }
  return context;
}
