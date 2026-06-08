import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchHistory } from "../api/client.ts";
import type { HistoryEntry } from "../types.ts";

interface HistoryContextValue {
  entries: HistoryEntry[];
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refreshHistory = useCallback(async () => {
    try {
      const data = await fetchHistory();
      setEntries(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  return (
    <HistoryContext.Provider value={{ entries, refreshHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error("useHistory must be used within HistoryProvider");
  }
  return ctx;
}
