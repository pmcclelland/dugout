import { createServerFn } from "@tanstack/react-start";
import {
  CODE_TAKEN_MESSAGE,
  codeLookupKey,
  isUniqueViolation,
  normalizeCode,
  parseCreateGameInput,
} from "@/lib/game-code";
import { normalizeSnapshot, type DugoutState } from "@/lib/snapshot";

export type GameRecord = {
  code: string;
  state: DugoutState;
  revision: number;
};

function parseState(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value;
}

function isCodeInput(value: unknown): value is { code: unknown; state?: unknown } {
  return value !== null && typeof value === "object" && "code" in value;
}

function requireCode(input: unknown): string {
  const raw =
    typeof input === "string"
      ? input
      : isCodeInput(input) && typeof input.code === "string"
        ? input.code
        : "";
  const code = normalizeCode(raw);
  if (!code) throw new Error("Invalid code");
  return code;
}

function lookupKey(code: string): string {
  return codeLookupKey(code) ?? code.toLowerCase();
}

export const createGame = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseCreateGameInput(input))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const payload = JSON.stringify(data.state);
    try {
      const rows = await sql<{ code: string }>`
        insert into games (code, state, revision)
        values (${data.code}, ${payload}::jsonb, 1)
        returning code
      `;
      const code = rows[0]?.code;
      if (!code) throw new Error("Could not start a game");
      return { code, revision: 1 };
    } catch (error) {
      if (isUniqueViolation(error)) throw new Error(CODE_TAKEN_MESSAGE);
      throw error;
    }
  });

export const loadGame = createServerFn({ method: "POST" })
  .validator((input: unknown): string => requireCode(input))
  .handler(async ({ data }): Promise<GameRecord | null> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const key = lookupKey(data);
    const rows = await sql<{ code: string; state: unknown; revision: number }>`
      select code, state, revision from games
      where lower(btrim(code)) = lower(${key})
      limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      code: row.code,
      state: normalizeSnapshot(parseState(row.state)),
      revision: Number(row.revision),
    };
  });

export const saveGame = createServerFn({ method: "POST" })
  .validator((input: unknown): { code: string; state: DugoutState } => {
    if (!isCodeInput(input)) throw new Error("Invalid game");
    return { code: requireCode(input), state: normalizeSnapshot(input.state) };
  })
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const payload = JSON.stringify(data.state);
    const key = lookupKey(data.code);
    const rows = await sql<{ revision: number }>`
      update games
      set state = ${payload}::jsonb,
          revision = revision + 1,
          updated_at = now()
      where lower(btrim(code)) = lower(${key})
      returning revision
    `;
    const row = rows[0];
    if (!row) throw new Error("Game not found");
    return { revision: Number(row.revision) };
  });
