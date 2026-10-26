import assert from "node:assert/strict";
import test from "node:test";
import { emptyLineup } from "./lineup.ts";
import { freshGame, formatCode, normalizeCode } from "./game-code.ts";
import type { DugoutState } from "./snapshot.ts";

test("normalizeCode accepts a spaced or hyphenated code", () => {
  assert.equal(normalizeCode("k7m-4qp"), "K7M4QP");
  assert.equal(normalizeCode("  k7m 4qp "), "K7M4QP");
});

test("normalizeCode rejects ambiguous or short codes", () => {
  assert.equal(normalizeCode("K7M-4Q"), null);
  assert.equal(normalizeCode("O0IL12"), null);
  assert.equal(normalizeCode(""), null);
});

test("formatCode groups the code", () => {
  assert.equal(formatCode("K7M4QP"), "K7M-4QP");
});

test("freshGame clears the field and the at-bat but keeps the roster", () => {
  const lineup = emptyLineup();
  lineup.P = "p1";
  const state: DugoutState = {
    teamName: "Mudcats",
    players: [{ id: "p1", name: "Ada Moss", number: "4", fromInning: 0 }],
    innings: [lineup, emptyLineup()],
    inningIndex: 1,
    tenField: false,
    battingOrder: ["p1"],
    batterIndex: 0,
    outIds: ["p1"],
    playerNotes: {
      p1: [{ id: "n1", text: "Keep the glove down", createdAt: "2026-10-26T12:00:00.000Z" }],
    },
  };
  const next = freshGame(state);
  assert.equal(next.inningIndex, 0);
  assert.equal(next.batterIndex, 0);
  assert.equal(next.innings.length, 2);
  assert.equal(next.innings[0].P, null);
  assert.deepEqual(next.outIds, []);
  assert.equal("playerNotes" in next, false);
  assert.equal(state.playerNotes.p1?.[0]?.text, "Keep the glove down");
  assert.equal(state.players[0]?.name, "Ada Moss");
});
