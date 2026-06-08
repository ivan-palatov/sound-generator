import type { HistoryEntry } from "./types.ts";

function dataDirUrl(): URL {
  const fromEnv = Deno.env.get("HISTORY_DATA_DIR");
  if (fromEnv) {
    const base = fromEnv.endsWith("/") ? fromEnv.slice(0, -1) : fromEnv;
    return new URL(`file://${base}/`);
  }

  if (Deno.build.standalone) {
    const execPath = Deno.execPath();
    const dir = execPath.slice(0, execPath.lastIndexOf("/") + 1);
    return new URL("./data/", `file://${dir}`);
  }

  return new URL("./data/", import.meta.url);
}

const DATA_DIR = dataDirUrl();
const HISTORY_PATH = new URL("history.json", DATA_DIR);

async function ensureFile(): Promise<void> {
  try {
    await Deno.stat(HISTORY_PATH);
  } catch {
    await Deno.mkdir(DATA_DIR, { recursive: true });
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
  return entries.sort((a, b) => {
    const aPinned = a.pinned ?? false;
    const bPinned = b.pinned ?? false;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export type HistoryUpdate = Pick<HistoryEntry, "title" | "pinned">;

export async function updateHistory(
  id: string,
  patch: Partial<HistoryUpdate>,
): Promise<HistoryEntry | null> {
  const entries = await readAll();
  const index = entries.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const entry = { ...entries[index] };
  if (patch.title !== undefined) entry.title = patch.title;
  if (patch.pinned !== undefined) entry.pinned = patch.pinned;

  entries[index] = entry;
  await writeAll(entries);
  return entry;
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
