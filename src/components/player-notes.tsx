import { useState } from "react";
import { formatNoteDate, MAX_NOTE_LENGTH, notesFor } from "@/lib/notes";
import { useDugout } from "@/lib/store";

export function PlayerNoteCount({ playerId }: { playerId: string }) {
  const count = useDugout((s) => notesFor(s.playerNotes, playerId).length);
  if (count === 0) return null;
  return (
    <span className="tabular-nums text-sm text-muted" aria-label={`${count} notes`}>
      {count}
    </span>
  );
}

export function PlayerNotesEditor({
  playerId,
  playerName,
}: {
  playerId: string;
  playerName: string;
}) {
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
    <div className="mt-3 border-t border-border pt-3">
      <h3 className="font-display text-lg tracking-wide">Notes</h3>
      <p className="mt-1 text-sm text-muted">
        Things to help {playerName} with, or encourage later.
      </p>
      {newestFirst.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing yet.</p>
      ) : (
        <ul className="mt-2">
          {newestFirst.map((note) => (
            <li key={note.id} className="border-t border-border py-2">
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
        className="mt-2 flex flex-col gap-2 sm:flex-row"
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
          className="input min-w-0 flex-1"
        />
        <button type="submit" className="btn btn-primary h-11 shrink-0 px-3">
          Add note
        </button>
      </form>
    </div>
  );
}
