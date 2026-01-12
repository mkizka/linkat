import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type UmamiTrackFn = (
  eventName: string,
  eventData?: Record<string, unknown>,
) => void;

interface UmamiContextValue {
  track: UmamiTrackFn;
}

const UmamiContext = createContext<UmamiContextValue | null>(null);

export function UmamiProvider({ children }: { children: ReactNode }) {
  const isLoadedRef = useRef(false);
  const queueRef = useRef<Array<[string, Record<string, unknown>?]>>([]);

  const track: UmamiTrackFn = useCallback((eventName, eventData) => {
    if (isLoadedRef.current) {
      void window.umami.track(eventName, eventData);
    } else {
      queueRef.current.push([eventName, eventData]);
    }
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (window.umami && "track" in window.umami) {
        isLoadedRef.current = true;
        clearInterval(checkInterval);

        queueRef.current.forEach(([eventName, eventData]) => {
          void window.umami.track(eventName, eventData);
        });
        queueRef.current = [];
      }
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
