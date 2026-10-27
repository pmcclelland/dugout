import assert from "node:assert/strict";
import test from "node:test";
import { ALL_POSITION_IDS, emptyLineup, sampleGame } from "./lineup.ts";
import {
  applyAvailability,
  availableOrder,
  availablePlayers,
  currentBatterIndex,
  DEFAULT_INNINGS,
  emptyGame,
  mergeAvailableOrder,
  newTeamFromCreateInput,
  nextAvailableIndex,
  normalizeSnapshot,
} from "./snapshot.ts";

function assertCleanSlate(state: ReturnType<typeof emptyGame>, teamName: string) {
  assert.equal(state.teamName, teamName);
  assert.deepEqual(state.players, []);
  assert.deepEqual(state.battingOrder, []);
  assert.equal(state.batterIndex, 0);
  assert.equal(state.inningIndex, 0);
  assert.equal(state.tenField, false);
  assert.deepEqual(state.outIds, []);
  assert.deepEqual(state.playerNotes, {});
  assert.equal(state.innings.length, DEFAULT_INNINGS);
  for (const inning of state.innings) {
    for (const pos of ALL_POSITION_IDS) {
      assert.equal(inning[pos], null);
    }
  }
}

test("emptyGame is a clean slate with no roster or playing-time data", () => {
  assertCleanSlate(emptyGame("Hawks"), "Hawks");
});

test("emptyGame never includes the sample Mudcats roster", () => {
  const blank = emptyGame("Mudcats");
  const sampleNames = sampleGame().players.map((player) => player.name);
  assert.equal(blank.players.length, 0);
  for (const name of sampleNames) {
    assert.equal(
      blank.players.some((player) => player.name === name),
      false,
    );
  }
});

test("newTeamFromCreateInput keeps the name and drops any copied roster or lineup", () => {
  const sample = sampleGame();
  const next = newTeamFromCreateInput({
    ...sample,
    teamName: "  Hawks  ",
  });
  assertCleanSlate(next, "Hawks");
});

test("newTeamFromCreateInput rejects a missing team name", () => {
  assert.throws(() => newTeamFromCreateInput({ players: [] }), /Invalid team/);
  assert.throws(() => newTeamFromCreateInput({ teamName: "   " }), /Invalid team/);
});

test("sampleGame still ships the Mudcats demo for Load sample roster", () => {
  const sample = sampleGame();
  assert.equal(sample.teamName, "Mudcats");
  assert.ok(sample.players.length > 0);
  assert.deepEqual(sample.outIds, []);
  assert.ok(sample.innings.some((inning) => ALL_POSITION_IDS.some((pos) => inning[pos])));
});

test("normalizeSnapshot treats missing outIds as everyone available", () => {
  const next = normalizeSnapshot({
    teamName: "Hawks",
    players: [{ id: "p1", name: "Ada", number: "4", fromInning: 0 }],
    battingOrder: ["p1"],
  });
  assert.deepEqual(next.outIds, []);
  assert.deepEqual(next.playerNotes, {});
  assert.equal(next.players[0]?.name, "Ada");
});

test("normalizeSnapshot keeps notes for rostered players and drops the rest", () => {
  const next = normalizeSnapshot({
    teamName: "Hawks",
    players: [{ id: "p1", name: "Ada", number: "4", fromInning: 0 }],
    playerNotes: {
      p1: [{ id: "n1", text: "  Glove down  ", createdAt: "2026-10-26T12:00:00.000Z" }],
      ghost: [{ id: "n9", text: "gone", createdAt: "2026-10-26T12:00:00.000Z" }],
    },
  });
  assert.deepEqual(next.playerNotes, {
    p1: [{ id: "n1", text: "Glove down", createdAt: "2026-10-26T12:00:00.000Z" }],
  });
});

test("normalizeSnapshot drops unknown out ids and pulls out players off the field", () => {
  const first = emptyLineup();
  first.P = "p1";
  first.C = "p2";
  const next = normalizeSnapshot({
    teamName: "Hawks",
    players: [
      { id: "p1", name: "Ada", number: "4", fromInning: 0 },
      { id: "p2", name: "Bo", number: "7", fromInning: 0 },
    ],
    innings: [first],
    battingOrder: ["p1", "p2"],
    outIds: ["p1", "ghost", "p1"],
  });
  assert.deepEqual(next.outIds, ["p1"]);
  assert.equal(next.innings[0]?.P, null);
  assert.equal(next.innings[0]?.C, "p2");
  assert.deepEqual(next.battingOrder, ["p1", "p2"]);
});

test("available players and batting skip out ids without removing them from the roster", () => {
  const players = [
    { id: "p1", name: "Ada", number: "4", fromInning: 0 },
    { id: "p2", name: "Bo", number: "7", fromInning: 0 },
  ];
  assert.deepEqual(
    availablePlayers(players, ["p2"]).map((player) => player.id),
    ["p1"],
  );
  assert.deepEqual(availableOrder(["p1", "p2", "p3"], ["p2"]), ["p1", "p3"]);
});

test("mergeAvailableOrder keeps an out player in their batting slot", () => {
  assert.deepEqual(mergeAvailableOrder(["p1", "p2", "p3"], ["p2"], ["p3", "p1"]), [
    "p3",
    "p2",
    "p1",
  ]);
});

test("next and current batter indexes skip out players", () => {
  assert.equal(nextAvailableIndex(["p1", "p2", "p3"], 1, ["p2"]), 2);
  assert.equal(currentBatterIndex(["p1", "p2", "p3"], 1, ["p2"]), 2);
  assert.equal(currentBatterIndex(["p1", "p2", "p3"], 0, []), 0);
});

test("applyAvailability marks a player out, pulls them off the field, and leaves them on the roster", () => {
  const first = emptyLineup();
  first.P = "p1";
  const state = {
    ...emptyGame("Hawks"),
    players: [
      { id: "p1", name: "Ada", number: "4", fromInning: 0 },
      { id: "p2", name: "Bo", number: "7", fromInning: 0 },
    ],
    innings: [first],
    battingOrder: ["p1", "p2"],
    batterIndex: 0,
  };
  const out = applyAvailability(state, "p1", true);
  assert.deepEqual(out.outIds, ["p1"]);
  assert.equal(out.innings[0]?.P, null);
  assert.equal(out.batterIndex, 1);
  assert.equal(state.players.length, 2);

  const back = applyAvailability({ ...state, ...out }, "p1", false);
  assert.deepEqual(back.outIds, []);
  assert.equal(back.innings[0]?.P, null);
});
