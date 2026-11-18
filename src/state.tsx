import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type AppContextValue = {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  setCompare: (ids: string[]) => void;
  message: string | null;
  toast: (text: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const value = useMemo<AppContextValue>(() => {
    const toast = (text: string) => {
      setMessage(text);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), 2600);
    };
    return {
      compareIds,
      toggleCompare: (id: string) => {
        setCompareIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
      },
      setCompare: (ids: string[]) => setCompareIds(ids),
      message,
      toast,
    };
  }, [compareIds, message]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppStateProvider");
  return value;
}
