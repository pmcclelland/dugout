import { emptyLineup } from "./lineup.ts";
import type { DugoutState } from "./snapshot.ts";

export const GAME_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const CODE_RE = new RegExp(`^[${GAME_CODE_ALPHABET}]{6}$`);

export function normalizeCode(raw: string): string | null {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return CODE_RE.test(compact) ? compact : null;
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/** Keep the roster, team name, and batting order. Clear the field, at-bat, and who is out. */
export function freshGame(
  state: DugoutState,
): Pick<DugoutState, "innings" | "inningIndex" | "batterIndex" | "outIds"> {
  const count = Math.max(1, state.innings.length);
  return {
    innings: Array.from({ length: count }, () => emptyLineup()),
    inningIndex: 0,
    batterIndex: 0,
    outIds: [],
  };
}
