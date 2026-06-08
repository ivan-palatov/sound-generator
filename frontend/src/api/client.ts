import type { GenerateRequest, HistoryEntry } from "../types.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data as T;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const data = await request<{ entries: HistoryEntry[] }>("/api/history");
  return data.entries;
}

export async function fetchHistoryEntry(id: string): Promise<HistoryEntry> {
  const data = await request<{ entry: HistoryEntry }>(`/api/history/${id}`);
  return data.entry;
}

export async function generateMusic(
  body: GenerateRequest,
): Promise<{ entry: HistoryEntry; error?: string }> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (response.status === 422) {
    return { entry: data.entry, error: data.error };
  }

  if (!response.ok) {
    throw new Error(data.error ?? "Generation failed");
  }

  return { entry: data.entry };
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await request(`/api/history/${id}`, { method: "DELETE" });
}
