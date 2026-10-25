import {
  ALL_POSITION_IDS,
  emptyLineup,
  normalizeLineup,
  type Lineup,
  type Player,
} from "./lineup.ts";

export const MAX_PLAYERS = 30;
export const MAX_INNINGS = 12;
export const DEFAULT_INNINGS = 6;

export type DugoutState = {
  teamName: string;
  players: Player[];
  innings: Lineup[];
  inningIndex: number;
  tenField: boolean;
  battingOrder: string[];
  batterIndex: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** A blank game: no roster, no assignments, no batting order. */
export function emptyGame(teamName = ""): DugoutState {
  const name = teamName.trim().slice(0, 40);
  return {
    teamName: name || "Team",
    players: [],
    innings: Array.from({ length: DEFAULT_INNINGS }, () => emptyLineup()),
    inningIndex: 0,
    tenField: false,
    battingOrder: [],
    batterIndex: 0,
  };
}

/**
 * State for a newly created team. Keeps only the name; any roster, lineup,
 * or playing-time fields on the input are ignored.
 */
export function newTeamFromCreateInput(input: unknown): DugoutState {
  const source = isRecord(input) ? input : {};
  const teamName = typeof source.teamName === "string" ? source.teamName.trim().slice(0, 40) : "";
  if (!teamName) throw new Error("Invalid team");
  return emptyGame(teamName);
}

function clampIndex(index: unknown, length: number): number {
  if (length <= 0) return 0;
  if (typeof index !== "number" || !Number.isFinite(index)) return 0;
  return Math.min(length - 1, Math.max(0, Math.floor(index)));
}

function cleanPlayer(raw: unknown): Player | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 80) return null;
  if (typeof raw.name !== "string") return null;
  const name = raw.name.trim().slice(0, 32);
  if (!name) return null;
  const number = typeof raw.number === "string" ? raw.number.trim().slice(0, 3) : "";
  const fromInning =
    typeof raw.fromInning === "number" && Number.isFinite(raw.fromInning)
      ? Math.min(MAX_INNINGS - 1, Math.max(0, Math.floor(raw.fromInning)))
      : 0;
  return { id: raw.id, name, number, fromInning };
}

export function alignBattingOrder(order: unknown, players: Player[]): string[] {
  const ids = new Set(players.map((player) => player.id));
  const next: string[] = [];
  const seen = new Set<string>();
  if (Array.isArray(order)) {
    for (const id of order) {
      if (typeof id !== "string" || !ids.has(id) || seen.has(id)) continue;
      seen.add(id);
      next.push(id);
    }
  }
  for (const player of players) {
    if (!seen.has(player.id)) next.push(player.id);
  }
  return next;
}

function cleanLineups(raw: unknown, ids: Set<string>, tenField: boolean): Lineup[] {
  const list = Array.isArray(raw) && raw.length > 0 ? raw : [emptyLineup()];
  return list.slice(0, MAX_INNINGS).map((item) => {
    const lineup = normalizeLineup(isRecord(item) ? (item as Partial<Lineup>) : null);
    const seen = new Set<string>();
    for (const pos of ALL_POSITION_IDS) {
      const playerId = lineup[pos];
      if (!playerId || !ids.has(playerId) || seen.has(playerId)) lineup[pos] = null;
      else seen.add(playerId);
    }
    if (!tenField) lineup.RV = null;
    return lineup;
  });
}

/** Coerce anything loaded from storage or the network into one canonical game. */
export function normalizeSnapshot(raw: unknown): DugoutState {
  const source = isRecord(raw) ? raw : {};
  const players: Player[] = [];
  const seen = new Set<string>();
  if (Array.isArray(source.players)) {
    for (const item of source.players) {
      const player = cleanPlayer(item);
      if (!player || seen.has(player.id)) continue;
      seen.add(player.id);
      players.push(player);
      if (players.length >= MAX_PLAYERS) break;
    }
  }
  const tenField = source.tenField === true;
  const ids = new Set(players.map((player) => player.id));
  const innings = cleanLineups(source.innings, ids, tenField);
  const battingOrder = alignBattingOrder(source.battingOrder, players);
  const teamName = typeof source.teamName === "string" ? source.teamName.trim().slice(0, 40) : "";
  return {
    teamName: teamName || "Team",
    players,
    innings,
    inningIndex: clampIndex(source.inningIndex, innings.length),
    tenField,
    battingOrder,
    batterIndex: clampIndex(source.batterIndex, battingOrder.length),
  };
}

/** Move `id` so it lands at `toIndex`. No-op when that is already true. */
export function moveInOrder(order: string[], id: string, toIndex: number): string[] {
  const from = order.indexOf(id);
  if (from < 0 || toIndex < 0 || toIndex >= order.length || from === toIndex) return order;
  const next = [...order];
  const [item] = next.splice(from, 1);
  if (!item) return order;
  next.splice(toIndex, 0, item);
  return next;
}
