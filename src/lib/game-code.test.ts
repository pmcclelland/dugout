import assert from "node:assert/strict";
import test from "node:test";
import { emptyLineup } from "./lineup.ts";
import {
  CODE_TAKEN_MESSAGE,
  codeLookupKey,
  formatCode,
  freshGame,
  isCodeTakenError,
  isUniqueViolation,
  normalizeCode,
  parseCreateGameInput,
} from "./game-code.ts";
import type { DugoutState } from "./snapshot.ts";

test("normalizeCode accepts a spaced or hyphenated legacy code", () => {
  assert.equal(normalizeCode("k7m-4qp"), "K7M4QP");
  assert.equal(normalizeCode("  k7m 4qp "), "K7M4QP");
});

test("normalizeCode keeps a chosen team code after trim", () => {
  assert.equal(normalizeCode("  Tigers  "), "Tigers");
  assert.equal(normalizeCode("tigers"), "tigers");
  assert.equal(normalizeCode("O0IL12"), "O0IL12");
  assert.equal(normalizeCode("K7M-4Q"), "K7M-4Q");
});

test("normalizeCode rejects a blank code", () => {
  assert.equal(normalizeCode(""), null);
  assert.equal(normalizeCode("   "), null);
});

test("codeLookupKey treats codes case-insensitively", () => {
  assert.equal(codeLookupKey("Tigers"), "tigers");
  assert.equal(codeLookupKey("tigers"), "tigers");
  assert.equal(codeLookupKey("k7m-4qp"), "k7m4qp");
  assert.equal(codeLookupKey("  "), null);
});

test("formatCode groups a legacy code and leaves a chosen code alone", () => {
  assert.equal(formatCode("K7M4QP"), "K7M-4QP");
  assert.equal(formatCode("Tigers"), "Tigers");
});

test("parseCreateGameInput keeps the name and chosen code", () => {
  const next = parseCreateGameInput({
    teamName: "  Hawks  ",
    code: "  Tigers  ",
    players: [{ id: "p1", name: "Ada", number: "4", fromInning: 0 }],
  });
  assert.equal(next.state.teamName, "Hawks");
  assert.deepEqual(next.state.players, []);
  assert.equal(next.code, "Tigers");
});

test("parseCreateGameInput rejects a missing name or code", () => {
  assert.throws(() => parseCreateGameInput({ code: "Tigers" }), /Invalid team/);
  assert.throws(() => parseCreateGameInput({ teamName: "Hawks", code: "   " }), /Invalid code/);
  assert.throws(() => parseCreateGameInput({ teamName: "Hawks" }), /Invalid code/);
});

test("isUniqueViolation recognizes Postgres unique conflicts", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(
    isUniqueViolation({ message: 'duplicate key value violates unique constraint "games_code_normalized_uidx"' }),
    true,
  );
  assert.equal(isUniqueViolation({ cause: { code: "23505" } }), true);
  assert.equal(isUniqueViolation({ message: "Could not start a game" }), false);
});

test("isCodeTakenError matches the inline create message", () => {
  assert.equal(isCodeTakenError(new Error(CODE_TAKEN_MESSAGE)), true);
  assert.equal(isCodeTakenError(new Error("Could not start a game")), false);
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
