import assert from "node:assert/strict";
import test from "node:test";
import { ALL_POSITION_IDS, sampleGame } from "./lineup.ts";
import { DEFAULT_INNINGS, emptyGame, newTeamFromCreateInput } from "./snapshot.ts";

function assertCleanSlate(state: ReturnType<typeof emptyGame>, teamName: string) {
  assert.equal(state.teamName, teamName);
  assert.deepEqual(state.players, []);
  assert.deepEqual(state.battingOrder, []);
  assert.equal(state.batterIndex, 0);
  assert.equal(state.inningIndex, 0);
  assert.equal(state.tenField, false);
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
  assert.ok(sample.innings.some((inning) => ALL_POSITION_IDS.some((pos) => inning[pos])));
});
