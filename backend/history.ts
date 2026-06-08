import type { HistoryEntry } from "./types.ts";

const HISTORY_PATH = new URL("./data/history.json", import.meta.url);

async function ensureFile(): Promise<void> {
  try {
    await Deno.stat(HISTORY_PATH);
  } catch {
    await Deno.mkdir(new URL("./data/", import.meta.url), { recursive: true });
    await Deno.writeTextFile(HISTORY_PATH, "[]");
  }
}

async function readAll(): Promise<HistoryEntry[]> {
  await ensureFile();
  const text = await Deno.readTextFile(HISTORY_PATH);
  return JSON.parse(text) as HistoryEntry[];
}

async function writeAll(entries: HistoryEntry[]): Promise<void> {
  await ensureFile();
  await Deno.writeTextFile(HISTORY_PATH, JSON.stringify(entries, null, 2));
}

export async function getHistory(id: string): Promise<HistoryEntry | null> {
  const entries = await readAll();
  return entries.find((e) => e.id === id) ?? null;
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const entries = await readAll();
  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function appendHistory(entry: HistoryEntry): Promise<HistoryEntry> {
  const entries = await readAll();
  entries.push(entry);
  await writeAll(entries);
  return entry;
}

export async function deleteHistory(id: string): Promise<boolean> {
  const entries = await readAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return false;
  entries.splice(index, 1);
  await writeAll(entries);
  return true;
}
