export type PositionId =
  | "P"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "RV";

export type Position = {
  id: PositionId;
  name: string;
  x: number;
  y: number;
};

export const POSITIONS: Position[] = [
  { id: "CF", name: "Center field", x: 50, y: 10 },
  { id: "LF", name: "Left field", x: 16, y: 24 },
  { id: "RF", name: "Right field", x: 84, y: 24 },
  { id: "RV", name: "Rover", x: 50, y: 36 },
  { id: "SS", name: "Shortstop", x: 28, y: 50 },
  { id: "2B", name: "Second base", x: 72, y: 50 },
  { id: "3B", name: "Third base", x: 16, y: 74 },
  { id: "P", name: "Pitcher", x: 50, y: 66 },
  { id: "1B", name: "First base", x: 84, y: 74 },
  { id: "C", name: "Catcher", x: 50, y: 88 },
];

export const ALL_POSITION_IDS: PositionId[] = POSITIONS.map((p) => p.id);

const FILL_ORDER: PositionId[] = ["LF", "CF", "RF", "1B", "2B", "SS", "3B", "RV", "C", "P"];

export function activePositions(tenField: boolean): Position[] {
  return tenField ? POSITIONS : POSITIONS.filter((p) => p.id !== "RV");
}

export function isPositionId(value: string): value is PositionId {
  return ALL_POSITION_IDS.some((id) => id === value);
}

export type Lineup = Record<PositionId, string | null>;

export function emptyLineup(): Lineup {
  return {
    P: null,
    C: null,
    "1B": null,
    "2B": null,
    "3B": null,
    SS: null,
    LF: null,
    CF: null,
    RF: null,
    RV: null,
  };
}

export type Player = {
  id: string;
  name: string;
  number: string;
  fromInning: number;
};

export function isSet(lineup: Lineup): boolean {
  return ALL_POSITION_IDS.some((id) => Boolean(lineup[id]));
}

export function isOnField(lineup: Lineup, playerId: string, tenField: boolean): boolean {
  return activePositions(tenField).some((p) => lineup[p.id] === playerId);
}

export function positionOf(
  lineup: Lineup,
  playerId: string,
  tenField: boolean,
): PositionId | null {
  for (const p of activePositions(tenField)) {
    if (lineup[p.id] === playerId) return p.id;
  }
  return null;
}

export function jerseySort(a: Player, b: Player): number {
  const na = Number.parseInt(a.number, 10);
  const nb = Number.parseInt(b.number, 10);
  const aOk = Number.isFinite(na);
  const bOk = Number.isFinite(nb);
  if (aOk && bOk && na !== nb) return na - nb;
  if (aOk !== bOk) return aOk ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function satStats(player: Player, innings: Lineup[], index: number, tenField: boolean) {
  let sits = 0;
  let eligible = 0;
  let satLast = false;
  let seen = false;
  for (let i = index - 1; i >= 0; i--) {
    const lineup = innings[i];
    if (!lineup || !isSet(lineup)) continue;
    if (i < player.fromInning) continue;
    const on = isOnField(lineup, player.id, tenField);
    if (!seen) {
      satLast = !on;
      seen = true;
    }
    eligible += 1;
    if (!on) sits += 1;
  }
  return { sits, eligible, satLast };
}

export function balanceInning(
  players: Player[],
  innings: Lineup[],
  index: number,
  tenField: boolean,
): Lineup {
  const positions = activePositions(tenField);
  const lineup = emptyLineup();
  if (players.length === 0) return lineup;

  const sitN = Math.max(0, players.length - positions.length);
  const allNew = players.every(
    (p) => satStats(p, innings, index, tenField).eligible === 0,
  );
  const ranked = [...players].sort((a, b) => {
    if (allNew) return jerseySort(b, a);
    const A = satStats(a, innings, index, tenField);
    const B = satStats(b, innings, index, tenField);
    const aNew = A.eligible === 0 ? 1 : 0;
    const bNew = B.eligible === 0 ? 1 : 0;
    if (aNew !== bNew) return aNew - bNew;
    if (A.sits !== B.sits) return A.sits - B.sits;
    const aLast = A.satLast ? 1 : 0;
    const bLast = B.satLast ? 1 : 0;
    if (aLast !== bLast) return aLast - bLast;
    return jerseySort(a, b);
  });
  const sitters = new Set(ranked.slice(0, sitN).map((p) => p.id));

  let last: Lineup | null = null;
  for (let i = index - 1; i >= 0; i--) {
    const prior = innings[i];
    if (prior && isSet(prior)) {
      last = prior;
      break;
    }
  }

  if (last) {
    for (const pos of positions) {
      const pid = last[pos.id];
      if (pid && !sitters.has(pid) && players.some((p) => p.id === pid)) {
        lineup[pos.id] = pid;
      }
    }
  }

  const placed = new Set(
    positions.map((p) => lineup[p.id]).filter((id): id is string => Boolean(id)),
  );
  const newcomers = players
    .filter((p) => !sitters.has(p.id) && !placed.has(p.id))
    .sort(jerseySort);
  const openings = FILL_ORDER.filter(
    (id) => positions.some((p) => p.id === id) && !lineup[id],
  );
  newcomers.forEach((player, i) => {
    const slot = openings[i];
    if (slot) lineup[slot] = player.id;
  });
  return lineup;
}

export type Fairness = {
  min: number;
  max: number;
  backToBack: string[];
  byPlayer: Record<string, { played: number; sat: number }>;
};

export function fairness(players: Player[], innings: Lineup[], tenField: boolean): Fairness {
  const byPlayer: Fairness["byPlayer"] = {};
  const backToBack: string[] = [];
  for (const player of players) {
    let played = 0;
    let sat = 0;
    let prevSat = false;
    let prevSet = false;
    for (let i = 0; i < innings.length; i++) {
      if (i < player.fromInning) continue;
      const lineup = innings[i];
      if (!lineup || !isSet(lineup)) {
        prevSet = false;
        continue;
      }
      const on = isOnField(lineup, player.id, tenField);
      if (on) {
        played += 1;
        prevSat = false;
      } else {
        sat += 1;
        if (prevSet && prevSat) backToBack.push(player.id);
        prevSat = true;
      }
      prevSet = true;
    }
    byPlayer[player.id] = { played, sat };
  }
  const sats = players.map((p) => byPlayer[p.id]?.sat ?? 0);
  return {
    min: sats.length ? Math.min(...sats) : 0,
    max: sats.length ? Math.max(...sats) : 0,
    backToBack: [...new Set(backToBack)],
    byPlayer,
  };
}

export function normalizeLineup(raw: Partial<Lineup> | null | undefined): Lineup {
  const lineup = emptyLineup();
  if (!raw) return lineup;
  for (const id of ALL_POSITION_IDS) {
    const value = raw[id];
    lineup[id] = typeof value === "string" && value ? value : null;
  }
  return lineup;
}

export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[parts.length - 1] ?? name) : name;
}

export function positionName(id: PositionId): string {
  return POSITIONS.find((p) => p.id === id)?.name ?? id;
}

const SAMPLE: Array<[string, string]> = [
  ["Miles Carter", "2"],
  ["Emma Walsh", "3"],
  ["Aiden Brooks", "4"],
  ["Jonah Hale", "7"],
  ["Sofia Alvarez", "8"],
  ["Caleb Nguyen", "9"],
  ["Harper Quinn", "11"],
  ["Maya Chen", "12"],
  ["Priya Shah", "15"],
  ["Noah Diaz", "18"],
  ["Luis Ortega", "21"],
  ["Theo Park", "22"],
];

export function samplePlayers(): Player[] {
  return SAMPLE.map(([name, number], i) => ({
    id: `p${i + 1}`,
    name,
    number,
    fromInning: 0,
  }));
}

function idByName(players: Player[], name: string): string {
  const player = players.find((p) => p.name === name);
  if (!player) throw new Error(`Missing sample player ${name}`);
  return player.id;
}

export function sampleGame() {
  const players = samplePlayers();
  const first = emptyLineup();
  first.P = idByName(players, "Jonah Hale");
  first.C = idByName(players, "Maya Chen");
  first["1B"] = idByName(players, "Luis Ortega");
  first["2B"] = idByName(players, "Emma Walsh");
  first["3B"] = idByName(players, "Miles Carter");
  first.SS = idByName(players, "Aiden Brooks");
  first.LF = idByName(players, "Caleb Nguyen");
  first.CF = idByName(players, "Harper Quinn");
  first.RF = idByName(players, "Sofia Alvarez");
  const innings: Lineup[] = [first];
  for (let i = 1; i < 6; i++) {
    innings.push(balanceInning(players, innings, i, false));
  }
  return {
    teamName: "Mudcats",
    players,
    innings,
    inningIndex: 0,
    tenField: false,
    battingOrder: players.map((player) => player.id),
    batterIndex: 0,
    outIds: [],
  };
}
