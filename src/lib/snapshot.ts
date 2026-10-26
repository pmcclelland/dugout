import {
  ALL_POSITION_IDS,
  emptyLineup,
  normalizeLineup,
  type Lineup,
  type Player,
} from "./lineup.ts";
import { emptyScorecard, normalizeScorecard, type Scorecard } from "./scorecard.ts";

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
  /** Player ids marked out for this game only. Missing on older saves. */
  outIds: string[];
  /** Live scorecard. Missing on older saves; treated as empty. */
  scorecard: Scorecard;
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
    outIds: [],
    scorecard: emptyScorecard(),
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
  const outIds = cleanOutIds(source.outIds, ids);
  const playableIds = new Set([...ids].filter((id) => !outIds.includes(id)));
  const innings = cleanLineups(source.innings, playableIds, tenField);
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
    outIds,
    scorecard: normalizeScorecard(source.scorecard),
  };
}

export function cleanOutIds(raw: unknown, playerIds: Set<string>): string[] {
  if (!Array.isArray(raw)) return [];
  const next: string[] = [];
  const seen = new Set<string>();
  for (const id of raw) {
    if (typeof id !== "string" || !playerIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function availablePlayers(players: Player[], outIds: string[]): Player[] {
  if (outIds.length === 0) return players;
  const out = new Set(outIds);
  return players.filter((player) => !out.has(player.id));
}

export function availableOrder(order: string[], outIds: string[]): string[] {
  if (outIds.length === 0) return order;
  const out = new Set(outIds);
  return order.filter((id) => !out.has(id));
}

/** Keep out players in their slots; replace the rest with `available`. */
export function mergeAvailableOrder(
  fullOrder: string[],
  outIds: string[],
  available: string[],
): string[] {
  const out = new Set(outIds);
  let index = 0;
  return fullOrder.map((id) => (out.has(id) ? id : (available[index++] ?? id)));
}

export function nextAvailableIndex(order: string[], start: number, outIds: string[]): number {
  if (order.length === 0) return 0;
  const out = new Set(outIds);
  const begin = ((start % order.length) + order.length) % order.length;
  for (let step = 0; step < order.length; step += 1) {
    const index = (begin + step) % order.length;
    const id = order[index];
    if (id && !out.has(id)) return index;
  }
  return 0;
}

export function currentBatterIndex(order: string[], batterIndex: number, outIds: string[]): number {
  const id = order[batterIndex];
  if (id && !outIds.includes(id)) return batterIndex;
  return nextAvailableIndex(order, batterIndex, outIds);
}

export function pullPlayerFromInnings(innings: Lineup[], playerId: string): Lineup[] {
  return innings.map((lineup) => {
    let changed = false;
    const next = { ...lineup };
    for (const pos of ALL_POSITION_IDS) {
      if (next[pos] === playerId) {
        next[pos] = null;
        changed = true;
      }
    }
    return changed ? next : lineup;
  });
}

export function applyAvailability(
  state: DugoutState,
  playerId: string,
  out: boolean,
): Pick<DugoutState, "outIds" | "innings" | "batterIndex"> {
  if (!state.players.some((player) => player.id === playerId)) {
    return { outIds: state.outIds, innings: state.innings, batterIndex: state.batterIndex };
  }
  const currentlyOut = state.outIds.includes(playerId);
  if (currentlyOut === out) {
    return { outIds: state.outIds, innings: state.innings, batterIndex: state.batterIndex };
  }
  const outIds = out ? [...state.outIds, playerId] : state.outIds.filter((id) => id !== playerId);
  const innings = out ? pullPlayerFromInnings(state.innings, playerId) : state.innings;
  let batterIndex = state.batterIndex;
  const currentId = state.battingOrder[batterIndex];
  if (!currentId || outIds.includes(currentId)) {
    batterIndex = nextAvailableIndex(state.battingOrder, batterIndex, outIds);
  }
  return { outIds, innings, batterIndex };
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
