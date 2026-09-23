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
