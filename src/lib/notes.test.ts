import assert from "node:assert/strict";
import test from "node:test";
import {
  addPlayerNote,
  dropPlayerNotes,
  emptyNotes,
  formatNoteDate,
  MAX_NOTE_LENGTH,
  MAX_NOTES_PER_PLAYER,
  normalizeNotes,
  notesFor,
  removePlayerNote,
  updatePlayerNote,
} from "./notes.ts";

const NOW = new Date("2026-10-26T15:00:00.000Z");

test("addPlayerNote appends a trimmed bullet for that player", () => {
  const next = addPlayerNote({}, "p1", "  Keep the glove down  ", {
    id: "n1",
    now: NOW,
  });
  assert.deepEqual(next, {
    p1: [{ id: "n1", text: "Keep the glove down", createdAt: NOW.toISOString() }],
  });
});

test("addPlayerNote ignores blank text and an empty player id", () => {
  assert.equal(addPlayerNote({}, "p1", "   "), null);
  assert.equal(addPlayerNote({}, "", "Hustle"), null);
});

test("addPlayerNote caps length and stops at the per-player limit", () => {
  const long = "x".repeat(MAX_NOTE_LENGTH + 20);
  const first = addPlayerNote({}, "p1", long, { id: "n1", now: NOW });
  assert.equal(first?.p1?.[0]?.text.length, MAX_NOTE_LENGTH);

  let notes = emptyNotes();
  for (let i = 0; i < MAX_NOTES_PER_PLAYER; i += 1) {
    const next = addPlayerNote(notes, "p1", `Note ${i}`, { id: `n${i}`, now: NOW });
    assert.ok(next);
    notes = next;
  }
  assert.equal(addPlayerNote(notes, "p1", "one more", { id: "overflow", now: NOW }), null);
  assert.equal(notesFor(notes, "p1").length, MAX_NOTES_PER_PLAYER);
});

test("updatePlayerNote rewrites one bullet and leaves the date alone", () => {
  const start = {
    p1: [{ id: "n1", text: "Old", createdAt: NOW.toISOString() }],
    p2: [{ id: "n2", text: "Other kid", createdAt: NOW.toISOString() }],
  };
  const next = updatePlayerNote(start, "p1", "n1", "  New cue  ");
  assert.deepEqual(next?.p1, [{ id: "n1", text: "New cue", createdAt: NOW.toISOString() }]);
  assert.equal(next?.p2?.[0]?.text, "Other kid");
});

test("updatePlayerNote no-ops when the text is empty, unchanged, or unknown", () => {
  const start = { p1: [{ id: "n1", text: "Same", createdAt: NOW.toISOString() }] };
  assert.equal(updatePlayerNote(start, "p1", "n1", "   "), null);
  assert.equal(updatePlayerNote(start, "p1", "n1", "Same"), null);
  assert.equal(updatePlayerNote(start, "p1", "missing", "Hello"), null);
  assert.equal(updatePlayerNote(start, "p9", "n1", "Hello"), null);
});

test("removePlayerNote deletes one bullet and drops the player key when empty", () => {
  const start = {
    p1: [
      { id: "n1", text: "First", createdAt: NOW.toISOString() },
      { id: "n2", text: "Second", createdAt: NOW.toISOString() },
    ],
  };
  const one = removePlayerNote(start, "p1", "n1");
  assert.deepEqual(one?.p1?.map((note) => note.id), ["n2"]);
  const none = removePlayerNote(one ?? {}, "p1", "n2");
  assert.deepEqual(none, {});
  assert.equal(removePlayerNote(start, "p1", "missing"), null);
});

test("dropPlayerNotes removes every bullet for that player", () => {
  const start = {
    p1: [{ id: "n1", text: "Ada", createdAt: NOW.toISOString() }],
    p2: [{ id: "n2", text: "Bo", createdAt: NOW.toISOString() }],
  };
  assert.deepEqual(dropPlayerNotes(start, "p1"), {
    p2: [{ id: "n2", text: "Bo", createdAt: NOW.toISOString() }],
  });
  assert.equal(dropPlayerNotes(start, "p9"), start);
});

test("normalizeNotes keeps valid notes and drops orphans, junk, and duplicates", () => {
  const raw = {
    p1: [
      { id: "n1", text: "  Glove  ", createdAt: "2026-10-26T12:00:00.000Z" },
      { id: "n1", text: "duplicate id", createdAt: "2026-10-26T13:00:00.000Z" },
      { id: "n2", text: "   " },
      { text: "no id", createdAt: "2026-10-26T12:00:00.000Z" },
      "nope",
    ],
    ghost: [{ id: "n9", text: "gone", createdAt: "2026-10-26T12:00:00.000Z" }],
  };
  const next = normalizeNotes(raw, new Set(["p1"]));
  assert.deepEqual(next, {
    p1: [{ id: "n1", text: "Glove", createdAt: "2026-10-26T12:00:00.000Z" }],
  });
});

test("normalizeNotes treats a missing or invalid field as empty", () => {
  assert.deepEqual(normalizeNotes(undefined, new Set(["p1"])), {});
  assert.deepEqual(normalizeNotes([], new Set(["p1"])), {});
});

test("formatNoteDate shows the year only when it is not this year", () => {
  assert.equal(formatNoteDate("2026-10-26T12:00:00.000Z", NOW), "Oct 26");
  assert.equal(formatNoteDate("2025-04-03T12:00:00.000Z", NOW), "Apr 3, 2025");
  assert.equal(formatNoteDate("not-a-date", NOW), "");
});
