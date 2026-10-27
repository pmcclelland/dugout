import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNoteDate, MAX_NOTE_LENGTH, notesFor, type PlayerNotes } from "@/lib/notes";
import type { Player } from "@/lib/lineup";
import { useDugout } from "@/lib/store";

function playersWithNotes(players: Player[], notes: PlayerNotes): Player[] {
  return [...players]
    .filter((player) => notesFor(notes, player.id).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function PlayerNotesPanel({ playerId, playerName }: { playerId: string; playerName: string }) {
  const notes = useDugout((s) => notesFor(s.playerNotes, playerId));
  const addNote = useDugout((s) => s.addNote);
  const updateNote = useDugout((s) => s.updateNote);
  const removeNote = useDugout((s) => s.removeNote);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const newestFirst = [...notes].sort((a, b) => {
    const aTime = Date.parse(a.createdAt);
    const bTime = Date.parse(b.createdAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) {
      return bTime - aTime;
    }
    return 0;
  });

  function startEdit(id: string, text: string) {
    setEditingId(id);
    setEditText(text);
  }

  function saveEdit() {
    if (!editingId) return;
    updateNote(playerId, editingId, editText);
    setEditingId(null);
    setEditText("");
  }

  return (
    <div className="border-t border-border px-1 pb-2 pt-2">
      {newestFirst.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul>
          {newestFirst.map((note) => (
            <li key={note.id} data-player-note={note.id} className="border-t border-border py-2 first:border-t-0">
              {editingId === note.id ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveEdit();
                  }}
                >
                  <textarea
                    aria-label="Edit note"
                    value={editText}
                    maxLength={MAX_NOTE_LENGTH}
                    rows={3}
                    onChange={(event) => setEditText(event.target.value)}
                    className="input min-h-20 w-full resize-y py-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="btn btn-primary h-11 px-3">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn h-11 px-3"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn h-11 px-3 text-warn"
                      onClick={() => {
                        removeNote(playerId, note.id);
                        setEditingId(null);
                        setEditText("");
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-pretty">{note.text}</p>
                    {note.createdAt ? (
                      <p className="mt-0.5 text-sm text-faint">{formatNoteDate(note.createdAt)}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="btn h-11 shrink-0 px-3 text-sm"
                    onClick={() => startEdit(note.id, note.text)}
                  >
                    Edit
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <form
        className="mt-2 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.trim()) return;
          addNote(playerId, draft);
          setDraft("");
        }}
      >
        <input
          aria-label={`Add a note about ${playerName}`}
          placeholder="Work on… or encourage…"
          value={draft}
          maxLength={MAX_NOTE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          className="input min-w-0 w-full"
        />
        <button type="submit" className="btn btn-primary h-11 w-full px-3 sm:w-auto sm:self-start">
          Add note
        </button>
      </form>
    </div>
  );
}

export function PlayerNotesCard({ players }: { players: Player[] }) {
  const playerNotes = useDugout((s) => s.playerNotes);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  const noted = playersWithNotes(players, playerNotes);
  const withoutNotes = [...players]
    .filter((player) => notesFor(playerNotes, player.id).length === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Keep an expanded row open after the first note lands via the picker.
  const visible = (() => {
    if (!openId) return noted;
    if (noted.some((player) => player.id === openId)) return noted;
    const picked = players.find((player) => player.id === openId);
    return picked ? [...noted, picked].sort((a, b) => a.name.localeCompare(b.name)) : noted;
  })();

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-3">
      <h2 className="font-display text-xl tracking-wide">Notes</h2>
      <p className="mt-1 text-sm text-muted">
        Things to help a kid with, or encourage later. Tap a name to open their notes.
      </p>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-2">
          {visible.map((player) => {
            const count = notesFor(playerNotes, player.id).length;
            const open = openId === player.id;
            return (
              <li key={player.id} className="border-t border-border">
                <button
                  type="button"
                  aria-expanded={open}
                  className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
                  onClick={() => toggle(player.id)}
                >
                  <span className="w-8 text-center font-display text-2xl leading-none tabular-nums">
                    {player.number || "–"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  {count > 0 ? (
                    <span className="tabular-nums text-sm text-muted" aria-label={`${count} notes`}>
                      {count}
                    </span>
                  ) : null}
                  <span className="text-sm text-muted">{open ? "Close" : "Open"}</span>
                </button>
                {open ? <PlayerNotesPanel playerId={player.id} playerName={player.name} /> : null}
              </li>
            );
          })}
        </ul>
      )}

      {withoutNotes.length > 0 ? (
        <div className="mt-3 border-t border-border pt-3">
          <Select
            key={pickerKey}
            onValueChange={(id) => {
              setOpenId(id);
              setPickerKey((n) => n + 1);
            }}
          >
            <SelectTrigger aria-label="Player to add notes for" className="w-full">
              <SelectValue placeholder="Add notes for…" />
            </SelectTrigger>
            <SelectContent position="popper">
              {withoutNotes.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.number ? `${player.number} ${player.name}` : player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </section>
  );
}
