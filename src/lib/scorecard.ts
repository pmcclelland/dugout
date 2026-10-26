/** Live scorecard: one plate appearance at a time, tallied by inning. */

export type FieldPos = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type OutKind = "fly" | "line" | "ground";

export type AtBatResult =
  | "1B"
  | "2B"
  | "3B"
  | "HR"
  | "BB"
  | "K"
  | "KL"
  | "HBP"
  | "E"
  | "FC"
  | "OUT";

export type RunnerBag = "batter" | "first" | "second" | "third";

export type Bases = {
  first: string | null;
  second: string | null;
  third: string | null;
};

export type PlayDraft = {
  result: AtBatResult;
  positions?: FieldPos[];
  outKind?: OutKind | null;
  runnersOut?: RunnerBag[];
  rbis?: number;
  basesReached?: 0 | 1 | 2 | 3 | 4;
};

export type Play = {
  id: string;
  inning: number;
  batterId: string;
  result: AtBatResult;
  notation: string;
  basesReached: 0 | 1 | 2 | 3 | 4;
  rbis: number;
  outs: number;
  scoredIds: string[];
  positions: FieldPos[];
  outKind: OutKind | null;
  runnersOut: RunnerBag[];
};

export type PitchCount = {
  playerId: string;
  count: number;
};

export type Scorecard = {
  plays: Play[];
  trackPitches: boolean;
  pitches: PitchCount[];
  opponentRuns: number[];
  closed: boolean;
};

export type InningTally = {
  runs: number;
  hits: number;
  outs: number;
};

export type PlayerLine = {
  playerId: string;
  ab: number;
  r: number;
  h: number;
  rbi: number;
  bb: number;
  k: number;
  hbp: number;
};

export type ScoreLive = {
  inning: number;
  outs: number;
  bases: Bases;
};

export const FIELD_NUM: Record<string, FieldPos> = {
  P: 1,
  C: 2,
  "1B": 3,
  "2B": 4,
  "3B": 5,
  SS: 6,
  LF: 7,
  CF: 8,
  RF: 9,
};

export const FIELD_LABEL: Record<FieldPos, string> = {
  1: "P",
  2: "C",
  3: "1B",
  4: "2B",
  5: "3B",
  6: "SS",
  7: "LF",
  8: "CF",
  9: "RF",
};

export const SCORE_SPOTS: Array<{
  id: keyof typeof FIELD_NUM;
  num: FieldPos;
  x: number;
  y: number;
}> = [
  { id: "CF", num: 8, x: 50, y: 9 },
  { id: "LF", num: 7, x: 13, y: 22 },
  { id: "RF", num: 9, x: 87, y: 22 },
  { id: "SS", num: 6, x: 24, y: 42 },
  { id: "2B", num: 4, x: 76, y: 42 },
  { id: "P", num: 1, x: 50, y: 56 },
  { id: "3B", num: 5, x: 13, y: 72 },
  { id: "1B", num: 3, x: 87, y: 72 },
  { id: "C", num: 2, x: 50, y: 90 },
];

export function emptyBases(): Bases {
  return { first: null, second: null, third: null };
}

export function emptyScorecard(trackPitches = false): Scorecard {
  return {
    plays: [],
    trackPitches,
    pitches: [],
    opponentRuns: [],
    closed: false,
  };
}

export function isFieldPos(value: unknown): value is FieldPos {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 || value === 6 || value === 7 || value === 8 || value === 9;
}

export function isAtBatResult(value: unknown): value is AtBatResult {
  return (
    value === "1B" ||
    value === "2B" ||
    value === "3B" ||
    value === "HR" ||
    value === "BB" ||
    value === "K" ||
    value === "KL" ||
    value === "HBP" ||
    value === "E" ||
    value === "FC" ||
    value === "OUT"
  );
}

export function isHit(result: AtBatResult): boolean {
  return result === "1B" || result === "2B" || result === "3B" || result === "HR";
}

export function defaultBasesReached(result: AtBatResult): 0 | 1 | 2 | 3 | 4 {
  switch (result) {
    case "1B":
    case "BB":
    case "HBP":
    case "E":
    case "FC":
      return 1;
    case "2B":
      return 2;
    case "3B":
      return 3;
    case "HR":
      return 4;
    case "K":
    case "KL":
    case "OUT":
      return 0;
    default: {
      const neverResult: never = result;
      return neverResult;
    }
  }
}

export function outNotation(positions: FieldPos[], kind: OutKind): string {
  if (positions.length === 0) {
    switch (kind) {
      case "fly":
        return "F";
      case "line":
        return "L";
      case "ground":
        return "GO";
      default: {
        const neverKind: never = kind;
        return neverKind;
      }
    }
  }
  if (positions.length === 1) {
    const num = positions[0];
    switch (kind) {
      case "fly":
        return `F${num}`;
      case "line":
        return `L${num}`;
      case "ground":
        return `G${num}`;
      default: {
        const neverKind: never = kind;
        return neverKind;
      }
    }
  }
  return positions.join("-");
}

export function playNotation(draft: PlayDraft): string {
  switch (draft.result) {
    case "1B":
      return "1B";
    case "2B":
      return "2B";
    case "3B":
      return "3B";
    case "HR":
      return "HR";
    case "BB":
      return "BB";
    case "K":
      return "K";
    case "KL":
      return "ꓘ";
    case "HBP":
      return "HBP";
    case "E": {
      const pos = draft.positions?.[0];
      return pos ? `E${pos}` : "E";
    }
    case "FC": {
      const chain = (draft.positions ?? []).join("-");
      return chain ? `FC ${chain}` : "FC";
    }
    case "OUT":
      return outNotation(draft.positions ?? [], draft.outKind ?? "ground");
    default: {
      const neverResult: never = draft.result;
      return neverResult;
    }
  }
}

function defaultRunnersOut(result: AtBatResult, bases: Bases): RunnerBag[] {
  switch (result) {
    case "OUT":
    case "K":
    case "KL":
      return ["batter"];
    case "FC":
      if (bases.first) return ["first"];
      if (bases.second) return ["second"];
      if (bases.third) return ["third"];
      return ["batter"];
    case "1B":
    case "2B":
    case "3B":
    case "HR":
    case "BB":
    case "HBP":
    case "E":
      return [];
    default: {
      const neverResult: never = result;
      return neverResult;
    }
  }
}

function advanceBy(
  bases: Bases,
  batterId: string,
  steps: 1 | 2 | 3 | 4,
): { bases: Bases; scoredIds: string[] } {
  const scoredIds: string[] = [];
  const placed: Array<string | null> = [null, null, null, null];

  function move(id: string | null, from: number) {
    if (!id) return;
    const dest = from + steps;
    if (dest >= 4) scoredIds.push(id);
    else placed[dest] = id;
  }

  move(bases.third, 3);
  move(bases.second, 2);
  move(bases.first, 1);
  move(batterId, 0);
  return {
    bases: { first: placed[1] ?? null, second: placed[2] ?? null, third: placed[3] ?? null },
    scoredIds,
  };
}

function forceAdvance(bases: Bases, batterId: string): { bases: Bases; scoredIds: string[] } {
  const scoredIds: string[] = [];
  const next = { ...bases };
  if (next.first) {
    if (next.second) {
      if (next.third) scoredIds.push(next.third);
      next.third = next.second;
    }
    next.second = next.first;
  }
  next.first = batterId;
  return { bases: next, scoredIds };
}

function removeOuts(
  bases: Bases,
  batterId: string,
  runnersOut: RunnerBag[],
  batterReaches: boolean,
): { bases: Bases; scoredIds: string[]; outs: number } {
  const outSet = new Set(runnersOut);
  const next = emptyBases();
  if (bases.first && !outSet.has("first")) next.first = bases.first;
  if (bases.second && !outSet.has("second")) next.second = bases.second;
  if (bases.third && !outSet.has("third")) next.third = bases.third;
  if (batterReaches && !outSet.has("batter") && !next.first) next.first = batterId;
  return { bases: next, scoredIds: [], outs: Math.max(1, outSet.size) };
}

function defaultRbis(result: AtBatResult, scoredIds: string[]): number {
  switch (result) {
    case "E":
    case "K":
    case "KL":
    case "OUT":
      return 0;
    case "1B":
    case "2B":
    case "3B":
    case "HR":
    case "BB":
    case "HBP":
    case "FC":
      return scoredIds.length;
    default: {
      const neverResult: never = result;
      return neverResult;
    }
  }
}

export function applyDraft(
  bases: Bases,
  batterId: string,
  draft: PlayDraft,
): { bases: Bases; scoredIds: string[]; outs: number; basesReached: 0 | 1 | 2 | 3 | 4 } {
  const runnersOut = draft.runnersOut ?? defaultRunnersOut(draft.result, bases);
  const reached = draft.basesReached ?? defaultBasesReached(draft.result);

  switch (draft.result) {
    case "K":
    case "KL":
    case "OUT": {
      const next = removeOuts(bases, batterId, runnersOut, false);
      return { ...next, basesReached: 0 };
    }
    case "FC": {
      const next = removeOuts(bases, batterId, runnersOut, true);
      return { ...next, basesReached: reached };
    }
    case "BB":
    case "HBP": {
      const next = forceAdvance(bases, batterId);
      return { ...next, outs: 0, basesReached: 1 };
    }
    case "1B":
    case "2B":
    case "3B":
    case "HR":
    case "E": {
      const steps = reached === 0 ? 1 : reached;
      const next = advanceBy(bases, batterId, steps);
      return { ...next, outs: 0, basesReached: reached };
    }
    default: {
      const neverResult: never = draft.result;
      return neverResult;
    }
  }
}

export function makePlay(
  bases: Bases,
  batterId: string,
  inning: number,
  draft: PlayDraft,
  id: string,
): { play: Play; bases: Bases } {
  const applied = applyDraft(bases, batterId, draft);
  const runnersOut = draft.runnersOut ?? defaultRunnersOut(draft.result, bases);
  const play: Play = {
    id,
    inning,
    batterId,
    result: draft.result,
    notation: playNotation(draft),
    basesReached: applied.basesReached,
    rbis: draft.rbis ?? defaultRbis(draft.result, applied.scoredIds),
    outs: applied.outs,
    scoredIds: applied.scoredIds,
    positions: [...(draft.positions ?? [])],
    outKind: draft.result === "OUT" ? (draft.outKind ?? "ground") : (draft.outKind ?? null),
    runnersOut,
  };
  return { play, bases: applied.bases };
}

export function liveScoring(plays: Play[]): ScoreLive {
  let inning = 0;
  let outs = 0;
  let bases = emptyBases();
  for (const play of plays) {
    if (play.inning !== inning) {
      inning = play.inning;
      outs = 0;
      bases = emptyBases();
    }
    const applied = applyDraft(bases, play.batterId, play);
    bases = applied.bases;
    outs += play.outs;
    if (outs >= 3) {
      inning += 1;
      outs = 0;
      bases = emptyBases();
    }
  }
  return { inning, outs, bases };
}

export function inningTally(plays: Play[], inning: number): InningTally {
  const slice = plays.filter((play) => play.inning === inning);
  return {
    runs: slice.reduce((sum, play) => sum + play.scoredIds.length, 0),
    hits: slice.filter((play) => isHit(play.result)).length,
    outs: slice.reduce((sum, play) => sum + play.outs, 0),
  };
}

export function gameTally(plays: Play[]): InningTally {
  const innings = new Set(plays.map((play) => play.inning));
  const tally = { runs: 0, hits: 0, outs: 0 };
  for (const inning of innings) {
    const row = inningTally(plays, inning);
    tally.runs += row.runs;
    tally.hits += row.hits;
    tally.outs += row.outs;
  }
  return tally;
}

export function inningCount(plays: Play[], scheduled: number): number {
  const fromPlays = plays.reduce((max, play) => Math.max(max, play.inning + 1), 0);
  const live = liveScoring(plays);
  return Math.max(scheduled, fromPlays, live.inning + 1, 1);
}

export function lineScore(plays: Play[], scheduled: number): InningTally[] {
  const count = inningCount(plays, scheduled);
  return Array.from({ length: count }, (_, inning) => inningTally(plays, inning));
}

export function opponentTotal(opponentRuns: number[]): number {
  return opponentRuns.reduce((sum, runs) => sum + Math.max(0, runs), 0);
}

export function boxScore(plays: Play[], order: string[]): PlayerLine[] {
  const lines = new Map<string, PlayerLine>();

  function line(id: string): PlayerLine {
    const existing = lines.get(id);
    if (existing) return existing;
    const created: PlayerLine = {
      playerId: id,
      ab: 0,
      r: 0,
      h: 0,
      rbi: 0,
      bb: 0,
      k: 0,
      hbp: 0,
    };
    lines.set(id, created);
    return created;
  }

  for (const play of plays) {
    const batter = line(play.batterId);
    if (play.result !== "BB" && play.result !== "HBP") batter.ab += 1;
    if (isHit(play.result)) batter.h += 1;
    if (play.result === "BB") batter.bb += 1;
    if (play.result === "K" || play.result === "KL") batter.k += 1;
    if (play.result === "HBP") batter.hbp += 1;
    batter.rbi += play.rbis;
    for (const id of play.scoredIds) line(id).r += 1;
  }

  const ids = [...order];
  for (const id of lines.keys()) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids.map((id) => line(id));
}

export function teamBox(lines: PlayerLine[]): Omit<PlayerLine, "playerId"> {
  return lines.reduce(
    (sum, line) => ({
      ab: sum.ab + line.ab,
      r: sum.r + line.r,
      h: sum.h + line.h,
      rbi: sum.rbi + line.rbi,
      bb: sum.bb + line.bb,
      k: sum.k + line.k,
      hbp: sum.hbp + line.hbp,
    }),
    { ab: 0, r: 0, h: 0, rbi: 0, bb: 0, k: 0, hbp: 0 },
  );
}

export function notationsFor(plays: Play[], batterId: string, inning: number): string[] {
  return plays
    .filter((play) => play.batterId === batterId && play.inning === inning)
    .map((play) => play.notation);
}

export function bumpPitches(pitches: PitchCount[], playerId: string, delta: number): PitchCount[] {
  if (!playerId) return pitches;
  const next = pitches.map((row) => ({ ...row }));
  const found = next.find((row) => row.playerId === playerId);
  const count = Math.max(0, (found?.count ?? 0) + delta);
  if (found) {
    found.count = count;
    return next.filter((row) => row.count > 0);
  }
  if (count === 0) return next;
  return [...next, { playerId, count }];
}

export function pitchCount(pitches: PitchCount[], playerId: string): number {
  return pitches.find((row) => row.playerId === playerId)?.count ?? 0;
}

export function setOpponentInning(opponentRuns: number[], inning: number, runs: number): number[] {
  const next = [...opponentRuns];
  while (next.length <= inning) next.push(0);
  next[inning] = Math.max(0, Math.min(99, Math.floor(runs)));
  while (next.length > 0 && next[next.length - 1] === 0) next.pop();
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function cleanPositions(raw: unknown): FieldPos[] {
  if (!Array.isArray(raw)) return [];
  const next: FieldPos[] = [];
  for (const item of raw) {
    if (isFieldPos(item)) next.push(item);
  }
  return next;
}

function cleanRunnersOut(raw: unknown): RunnerBag[] {
  if (!Array.isArray(raw)) return [];
  const next: RunnerBag[] = [];
  for (const item of raw) {
    if (item === "batter" || item === "first" || item === "second" || item === "third") {
      if (!next.includes(item)) next.push(item);
    }
  }
  return next;
}

function cleanPlay(raw: unknown): Play | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 80) return null;
  if (typeof raw.batterId !== "string" || raw.batterId.length === 0) return null;
  if (!isAtBatResult(raw.result)) return null;
  if (typeof raw.inning !== "number" || !Number.isFinite(raw.inning) || raw.inning < 0) return null;
  const inning = Math.min(11, Math.floor(raw.inning));
  const positions = cleanPositions(raw.positions);
  const runnersOut = cleanRunnersOut(raw.runnersOut);
  const outKind =
    raw.outKind === "fly" || raw.outKind === "line" || raw.outKind === "ground" ? raw.outKind : null;
  const basesReached =
    raw.basesReached === 0 ||
    raw.basesReached === 1 ||
    raw.basesReached === 2 ||
    raw.basesReached === 3 ||
    raw.basesReached === 4
      ? raw.basesReached
      : defaultBasesReached(raw.result);
  const rbis =
    typeof raw.rbis === "number" && Number.isFinite(raw.rbis)
      ? Math.min(4, Math.max(0, Math.floor(raw.rbis)))
      : 0;
  const outs =
    typeof raw.outs === "number" && Number.isFinite(raw.outs)
      ? Math.min(3, Math.max(0, Math.floor(raw.outs)))
      : 0;
  const scoredIds: string[] = [];
  if (Array.isArray(raw.scoredIds)) {
    for (const id of raw.scoredIds) {
      if (typeof id === "string" && id && !scoredIds.includes(id)) scoredIds.push(id);
    }
  }
  const notation =
    typeof raw.notation === "string" && raw.notation.trim()
      ? raw.notation.trim().slice(0, 16)
      : playNotation({ result: raw.result, positions, outKind: outKind ?? undefined });
  return {
    id: raw.id,
    inning,
    batterId: raw.batterId,
    result: raw.result,
    notation,
    basesReached,
    rbis,
    outs,
    scoredIds,
    positions,
    outKind,
    runnersOut,
  };
}

function cleanPitches(raw: unknown): PitchCount[] {
  if (!Array.isArray(raw)) return [];
  const next: PitchCount[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item)) continue;
    if (typeof item.playerId !== "string" || !item.playerId || seen.has(item.playerId)) continue;
    if (typeof item.count !== "number" || !Number.isFinite(item.count)) continue;
    const count = Math.min(300, Math.max(0, Math.floor(item.count)));
    if (count === 0) continue;
    seen.add(item.playerId);
    next.push({ playerId: item.playerId, count });
  }
  return next;
}

export function normalizeScorecard(raw: unknown): Scorecard {
  const source = isRecord(raw) ? raw : {};
  const plays: Play[] = [];
  const seen = new Set<string>();
  if (Array.isArray(source.plays)) {
    for (const item of source.plays) {
      const play = cleanPlay(item);
      if (!play || seen.has(play.id)) continue;
      seen.add(play.id);
      plays.push(play);
    }
  }
  const opponentRuns: number[] = [];
  if (Array.isArray(source.opponentRuns)) {
    for (const item of source.opponentRuns) {
      if (typeof item !== "number" || !Number.isFinite(item)) {
        opponentRuns.push(0);
        continue;
      }
      opponentRuns.push(Math.min(99, Math.max(0, Math.floor(item))));
    }
  }
  return {
    plays,
    trackPitches: source.trackPitches === true,
    pitches: cleanPitches(source.pitches),
    opponentRuns,
    closed: source.closed === true,
  };
}

export function cloneScorecard(scorecard: Scorecard): Scorecard {
  return {
    plays: scorecard.plays.map((play) => ({
      ...play,
      scoredIds: [...play.scoredIds],
      positions: [...play.positions],
      runnersOut: [...play.runnersOut],
    })),
    trackPitches: scorecard.trackPitches,
    pitches: scorecard.pitches.map((row) => ({ ...row })),
    opponentRuns: [...scorecard.opponentRuns],
    closed: scorecard.closed,
  };
}
