import { createServerFn } from "@tanstack/react-start";
import { GAME_CODE_ALPHABET, normalizeCode } from "@/lib/game-code";
import { newTeamFromCreateInput, normalizeSnapshot, type DugoutState } from "@/lib/snapshot";

export type GameRecord = {
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

function newCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) code += GAME_CODE_ALPHABET[byte % GAME_CODE_ALPHABET.length];
  return code;
}

export const createGame = createServerFn({ method: "POST" })
  .validator((input: unknown): DugoutState => newTeamFromCreateInput(input))
  .handler(async ({ data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const payload = JSON.stringify(data);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = newCode();
      const rows = await sql<{ code: string }>`
        insert into games (code, state, revision)
        values (${code}, ${payload}::jsonb, 1)
        on conflict (code) do nothing
        returning code
      `;
      if (rows[0]) return { code, revision: 1 };
    }
    throw new Error("Could not start a game");
  });

export const loadGame = createServerFn({ method: "POST" })
  .validator((input: unknown): string => requireCode(input))
  .handler(async ({ data }): Promise<GameRecord | null> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ state: unknown; revision: number }>`
      select state, revision from games where code = ${data} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return { state: normalizeSnapshot(parseState(row.state)), revision: Number(row.revision) };
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
    const rows = await sql<{ revision: number }>`
      update games
      set state = ${payload}::jsonb,
          revision = revision + 1,
          updated_at = now()
      where code = ${data.code}
      returning revision
    `;
    const row = rows[0];
    if (!row) throw new Error("Game not found");
    return { revision: Number(row.revision) };
  });
