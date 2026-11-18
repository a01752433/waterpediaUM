import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

type AppContextValue = {
  compareIds: string[];
  toggleCompare: (id: string) => void;
  setCompare: (ids: string[]) => void;
  message: string | null;
  toast: (text: string) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = window.localStorage.getItem("waterpedia-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const timer = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("waterpedia-theme", theme);
  }, [theme]);

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
      theme,
      toggleTheme: () => setTheme((current) => (current === "light" ? "dark" : "light")),
    };
  }, [compareIds, message, theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used within AppStateProvider");
  return value;
}
