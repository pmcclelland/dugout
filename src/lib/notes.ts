export const MAX_NOTE_LENGTH = 240;
export const MAX_NOTES_PER_PLAYER = 50;

export type PlayerNote = {
  id: string;
  text: string;
  createdAt: string;
};

export type PlayerNotes = Record<string, PlayerNote[]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

const EMPTY_NOTE_LIST: PlayerNote[] = [];

export function emptyNotes(): PlayerNotes {
  return {};
}

export function notesFor(notes: PlayerNotes, playerId: string): PlayerNote[] {
  return notes[playerId] ?? EMPTY_NOTE_LIST;
}

export function cloneNotes(notes: PlayerNotes): PlayerNotes {
  const next: PlayerNotes = {};
  for (const [playerId, list] of Object.entries(notes)) {
    next[playerId] = list.map((note) => ({ ...note }));
  }
  return next;
}

export function addPlayerNote(
  notes: PlayerNotes,
  playerId: string,
  text: string,
  options: { id?: string; now?: Date } = {},
): PlayerNotes | null {
  if (!playerId) return null;
  const cleaned = text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!cleaned) return null;
  const existing = notes[playerId] ?? [];
  if (existing.length >= MAX_NOTES_PER_PLAYER) return null;
  const note: PlayerNote = {
    id: options.id ?? crypto.randomUUID(),
    text: cleaned,
    createdAt: (options.now ?? new Date()).toISOString(),
  };
  return { ...notes, [playerId]: [...existing, note] };
}

export function updatePlayerNote(
  notes: PlayerNotes,
  playerId: string,
  noteId: string,
  text: string,
): PlayerNotes | null {
  const list = notes[playerId];
  if (!list) return null;
  const cleaned = text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!cleaned) return null;
  const index = list.findIndex((note) => note.id === noteId);
  if (index < 0) return null;
  const current = list[index];
  if (!current || current.text === cleaned) return null;
  return {
    ...notes,
    [playerId]: list.map((note) => (note.id === noteId ? { ...note, text: cleaned } : note)),
  };
}

export function removePlayerNote(
  notes: PlayerNotes,
  playerId: string,
  noteId: string,
): PlayerNotes | null {
  const list = notes[playerId];
  if (!list) return null;
  const next = list.filter((note) => note.id !== noteId);
  if (next.length === list.length) return null;
  if (next.length === 0) return dropPlayerNotes(notes, playerId);
  return { ...notes, [playerId]: next };
}

export function dropPlayerNotes(notes: PlayerNotes, playerId: string): PlayerNotes {
  if (!(playerId in notes)) return notes;
  const { [playerId]: _removed, ...rest } = notes;
  return rest;
}

function cleanNote(raw: unknown): PlayerNote | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 80) return null;
  if (typeof raw.text !== "string") return null;
  const text = raw.text.trim().slice(0, MAX_NOTE_LENGTH);
  if (!text) return null;
  const createdAt =
    typeof raw.createdAt === "string" && Number.isFinite(Date.parse(raw.createdAt))
      ? new Date(Date.parse(raw.createdAt)).toISOString()
      : "";
  return { id: raw.id, text, createdAt };
}

/** Keep notes for known players only. Older saves without the field become {}. */
export function normalizeNotes(raw: unknown, playerIds: Set<string>): PlayerNotes {
  if (!isRecord(raw)) return emptyNotes();
  const next: PlayerNotes = {};
  for (const [playerId, list] of Object.entries(raw)) {
    if (!playerIds.has(playerId) || !Array.isArray(list)) continue;
    const cleaned: PlayerNote[] = [];
    const seen = new Set<string>();
    for (const item of list) {
      const note = cleanNote(item);
      if (!note || seen.has(note.id)) continue;
      seen.add(note.id);
      cleaned.push(note);
      if (cleaned.length >= MAX_NOTES_PER_PLAYER) break;
    }
    if (cleaned.length > 0) next[playerId] = cleaned;
  }
  return next;
}

export function formatNoteDate(iso: string, now = new Date()): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
