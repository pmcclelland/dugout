import { emptyLineup } from "./lineup.ts";
import { newTeamFromCreateInput, type DugoutState } from "./snapshot.ts";

export const GAME_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_TAKEN_MESSAGE = "That code has already been used — try another.";

const LEGACY_CODE_RE = new RegExp(`^[${GAME_CODE_ALPHABET}]{6}$`);

/**
 * Trim. Legacy generated codes stay compact (K7M-4QP → K7M4QP) so existing
 * teams keep working. Chosen codes keep the coach's text after trim.
 */
export function normalizeCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const compact = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return LEGACY_CODE_RE.test(compact) ? compact : trimmed;
}

/** Case-insensitive key used for uniqueness and joins. */
export function codeLookupKey(raw: string): string | null {
  const code = normalizeCode(raw);
  return code ? code.toLowerCase() : null;
}

export function formatCode(code: string): string {
  return LEGACY_CODE_RE.test(code) ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

export function parseCreateGameInput(input: unknown): { state: DugoutState; code: string } {
  const state = newTeamFromCreateInput(input);
  const source = input !== null && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const code = typeof source.code === "string" ? normalizeCode(source.code) : null;
  if (!code) throw new Error("Invalid code");
  return { state, code };
}

export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown; cause?: unknown };
  if (record.code === "23505") return true;
  if (
    typeof record.message === "string" &&
    /duplicate key|unique constraint|unique violation/i.test(record.message)
  ) {
    return true;
  }
  return record.cause !== undefined && isUniqueViolation(record.cause);
}

export function isCodeTakenError(error: unknown): boolean {
  if (error instanceof Error) return error.message.includes("already been used");
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    return typeof message === "string" && message.includes("already been used");
  }
  return false;
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
