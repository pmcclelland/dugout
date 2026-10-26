import assert from "node:assert/strict";
import test from "node:test";
import { availableOrder, nextAvailableIndex } from "./snapshot.ts";
import {
  applyDraft,
  boxScore,
  bumpPitches,
  emptyBases,
  emptyScorecard,
  gameTally,
  inningTally,
  lineScore,
  liveScoring,
  makePlay,
  normalizeScorecard,
  outNotation,
  playNotation,
  type Bases,
  type Play,
  type PlayDraft,
} from "./scorecard.ts";

function record(
  plays: Play[],
  batterId: string,
  draft: PlayDraft,
  id = `play-${plays.length + 1}`,
): Play[] {
  const live = liveScoring(plays);
  const { play } = makePlay(live.bases, batterId, live.inning, draft, id);
  return [...plays, play];
}

function names(ids: string[]): string[] {
  return ids;
}

test("out notation: SS then 1B is 6-3", () => {
  assert.equal(outNotation([6, 3], "ground"), "6-3");
});

test("out notation: 2B to SS to 1B is 4-6-3", () => {
  assert.equal(outNotation([4, 6, 3], "ground"), "4-6-3");
});

test("out notation: single tap CF is F8 or L8", () => {
  assert.equal(outNotation([8], "fly"), "F8");
  assert.equal(outNotation([8], "line"), "L8");
  assert.equal(playNotation({ result: "OUT", positions: [8], outKind: "fly" }), "F8");
  assert.equal(playNotation({ result: "OUT", positions: [8], outKind: "line" }), "L8");
});

test("out notation: unassisted ground to 1B is G3", () => {
  assert.equal(outNotation([3], "ground"), "G3");
});

test("result notation covers walks, strikeouts, and errors", () => {
  assert.equal(playNotation({ result: "K" }), "K");
  assert.equal(playNotation({ result: "KL" }), "ꓘ");
  assert.equal(playNotation({ result: "BB" }), "BB");
  assert.equal(playNotation({ result: "HBP" }), "HBP");
  assert.equal(playNotation({ result: "E", positions: [6] }), "E6");
  assert.equal(playNotation({ result: "FC", positions: [6, 4] }), "FC 6-4");
});

test("single with empty bases puts the batter on first", () => {
  const { play, bases } = makePlay(emptyBases(), "carter", 0, { result: "1B" }, "p1");
  assert.equal(play.notation, "1B");
  assert.equal(play.outs, 0);
  assert.deepEqual(play.scoredIds, []);
  assert.equal(bases.first, "carter");
  assert.equal(bases.second, null);
});

test("walk forces a runner from first; bases-loaded walk scores and RBIs", () => {
  const onFirst: Bases = { first: "walsh", second: null, third: null };
  const forced = applyDraft(onFirst, "carter", { result: "BB" });
  assert.equal(forced.bases.first, "carter");
  assert.equal(forced.bases.second, "walsh");
  assert.deepEqual(forced.scoredIds, []);

  const loaded: Bases = { first: "a", second: "b", third: "c" };
  const walk = makePlay(loaded, "carter", 0, { result: "BB" }, "p1");
  assert.deepEqual(walk.play.scoredIds, ["c"]);
  assert.equal(walk.play.rbis, 1);
  assert.equal(walk.bases.third, "b");
  assert.equal(walk.bases.second, "a");
  assert.equal(walk.bases.first, "carter");
});

test("home run scores everyone including the batter", () => {
  const loaded: Bases = { first: "a", second: "b", third: "c" };
  const { play, bases } = makePlay(loaded, "carter", 0, { result: "HR" }, "p1");
  assert.deepEqual(play.scoredIds, ["c", "b", "a", "carter"]);
  assert.equal(play.rbis, 4);
  assert.deepEqual(bases, emptyBases());
});

test("double play 4-6-3 takes the runner and the batter", () => {
  const onFirst: Bases = { first: "walsh", second: null, third: null };
  const { play, bases } = makePlay(
    onFirst,
    "carter",
    0,
    {
      result: "OUT",
      positions: [4, 6, 3],
      outKind: "ground",
      runnersOut: ["first", "batter"],
    },
    "dp",
  );
  assert.equal(play.notation, "4-6-3");
  assert.equal(play.outs, 2);
  assert.deepEqual(bases, emptyBases());
  assert.deepEqual(play.scoredIds, []);
});

test("fielder's choice defaults to the runner on first being out", () => {
  const onFirst: Bases = { first: "walsh", second: null, third: null };
  const { play, bases } = makePlay(onFirst, "carter", 0, { result: "FC", positions: [6, 4] }, "fc");
  assert.equal(play.notation, "FC 6-4");
  assert.equal(play.outs, 1);
  assert.equal(bases.first, "carter");
  assert.equal(bases.second, null);
});

test("error does not award an RBI when a run scores", () => {
  const onThird: Bases = { first: null, second: null, third: "hale" };
  const { play } = makePlay(onThird, "carter", 0, { result: "E", positions: [6] }, "e1");
  assert.equal(play.notation, "E6");
  assert.deepEqual(play.scoredIds, ["hale"]);
  assert.equal(play.rbis, 0);
});

test("inning tallies runs, hits, and outs; game totals roll up", () => {
  let plays: Play[] = [];
  plays = record(plays, "p1", { result: "2B" });
  plays = record(plays, "p2", { result: "2B" });
  plays = record(plays, "p3", { result: "OUT", positions: [8], outKind: "fly" });
  plays = record(plays, "p4", {
    result: "OUT",
    positions: [6, 3],
    outKind: "ground",
    runnersOut: ["batter"],
  });
  plays = record(plays, "p5", { result: "K" });

  const first = inningTally(plays, 0);
  assert.equal(first.hits, 2);
  assert.equal(first.runs, 1);
  assert.equal(first.outs, 3);

  plays = record(plays, "p6", { result: "HR" });
  plays = record(plays, "p1", { result: "K" });
  const second = inningTally(plays, 1);
  assert.equal(second.hits, 1);
  assert.equal(second.runs, 1);
  assert.equal(second.outs, 1);

  const game = gameTally(plays);
  assert.equal(game.hits, 3);
  assert.equal(game.runs, 2);
  assert.equal(game.outs, 4);

  const lines = lineScore(plays, 6);
  assert.equal(lines[0]?.runs, 1);
  assert.equal(lines[1]?.runs, 1);
});

test("three outs clear the bases and start the next inning", () => {
  let plays: Play[] = [];
  plays = record(plays, "p1", { result: "1B" });
  plays = record(plays, "p2", { result: "K" });
  plays = record(plays, "p3", { result: "K" });
  plays = record(plays, "p4", { result: "OUT", positions: [8], outKind: "fly" });
  const live = liveScoring(plays);
  assert.equal(live.inning, 1);
  assert.equal(live.outs, 0);
  assert.deepEqual(live.bases, emptyBases());
  assert.equal(plays[3]?.inning, 0);
  plays = record(plays, "p5", { result: "1B" });
  assert.equal(plays[4]?.inning, 1);
  assert.equal(liveScoring(plays).bases.first, "p5");
});

test("undo last play restores bases, batter, and tallies", () => {
  let plays: Play[] = [];
  plays = record(plays, "p1", { result: "1B" });
  plays = record(plays, "p2", {
    result: "OUT",
    positions: [4, 6, 3],
    outKind: "ground",
    runnersOut: ["first", "batter"],
  });
  assert.equal(inningTally(plays, 0).outs, 2);
  assert.deepEqual(liveScoring(plays).bases, emptyBases());

  plays = plays.slice(0, -1);
  const live = liveScoring(plays);
  assert.equal(live.outs, 0);
  assert.equal(live.bases.first, "p1");
  assert.equal(inningTally(plays, 0).outs, 0);
  assert.equal(inningTally(plays, 0).hits, 1);
});

test("available batting order skips players marked out for the game", () => {
  const order = ["p1", "p2", "p3", "p4"];
  const outIds = ["p2"];
  const live = availableOrder(order, outIds);
  assert.deepEqual(live, ["p1", "p3", "p4"]);
  assert.equal(nextAvailableIndex(order, 0, outIds), 0);
  assert.equal(nextAvailableIndex(order, 1, outIds), 2);
  assert.equal(nextAvailableIndex(order, 2, outIds), 2);

  let plays: Play[] = [];
  plays = record(plays, "p1", { result: "K" });
  const next = nextAvailableIndex(order, order.indexOf("p1") + 1, outIds);
  assert.equal(order[next], "p3");
  plays = record(plays, order[next] ?? "p3", { result: "1B" });
  assert.equal(plays[1]?.batterId, "p3");
  assert.deepEqual(
    names(plays.map((play) => play.batterId)),
    ["p1", "p3"],
  );
});

test("box score counts AB, R, H, RBI and skips walks from at-bats", () => {
  let plays: Play[] = [];
  plays = record(plays, "p1", { result: "1B" });
  plays = record(plays, "p2", { result: "HR" });
  plays = record(plays, "p3", { result: "BB" });
  plays = record(plays, "p4", { result: "K" });
  const lines = boxScore(plays, ["p1", "p2", "p3", "p4"]);
  const byId = Object.fromEntries(lines.map((line) => [line.playerId, line]));
  assert.equal(byId.p1?.ab, 1);
  assert.equal(byId.p1?.h, 1);
  assert.equal(byId.p1?.r, 1);
  assert.equal(byId.p2?.h, 1);
  assert.equal(byId.p2?.r, 1);
  assert.equal(byId.p2?.rbi, 2);
  assert.equal(byId.p3?.ab, 0);
  assert.equal(byId.p3?.bb, 1);
  assert.equal(byId.p4?.k, 1);
});

test("normalizeScorecard treats missing data as a blank card", () => {
  const blank = normalizeScorecard(undefined);
  assert.deepEqual(blank, emptyScorecard());
  const dirty = normalizeScorecard({
    trackPitches: true,
    closed: true,
    plays: [
      {
        id: "p1",
        inning: 0,
        batterId: "a",
        result: "1B",
        notation: "1B",
        basesReached: 1,
        rbis: 0,
        outs: 0,
        scoredIds: [],
      },
      { id: "bad", result: "XYZ" },
    ],
    pitches: [{ playerId: "pitch", count: 12 }],
    opponentRuns: [2, "x", 1],
  });
  assert.equal(dirty.trackPitches, true);
  assert.equal(dirty.closed, true);
  assert.equal(dirty.plays.length, 1);
  assert.equal(dirty.plays[0]?.notation, "1B");
  assert.deepEqual(dirty.pitches, [{ playerId: "pitch", count: 12 }]);
  assert.deepEqual(dirty.opponentRuns, [2, 0, 1]);
});

test("pitch count stays off the card until it is turned on and incremented", () => {
  const card = emptyScorecard();
  assert.equal(card.trackPitches, false);
  assert.deepEqual(bumpPitches([], "p1", 1), [{ playerId: "p1", count: 1 }]);
  assert.deepEqual(bumpPitches([{ playerId: "p1", count: 1 }], "p1", -1), []);
});
