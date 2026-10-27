import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { isUniqueViolation } from "./game-code.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

async function openGamesDb() {
  const pg = new PGlite();
  await pg.waitReady;
  await pg.exec(readFileSync(join(root, "migrations/0003_games.sql"), "utf8"));
  await pg.exec(readFileSync(join(root, "migrations/0004_games_code_normalized.sql"), "utf8"));
  return pg;
}

test("games reject a second team that only differs by case", async () => {
  const pg = await openGamesDb();
  const state = JSON.stringify({ teamName: "Tigers" });
  await pg.query("insert into games (code, state, revision) values ($1, $2::jsonb, 1)", [
    "Tigers",
    state,
  ]);

  await assert.rejects(
    () =>
      pg.query("insert into games (code, state, revision) values ($1, $2::jsonb, 1)", [
        "tigers",
        state,
      ]),
    (error: unknown) => {
      assert.equal(isUniqueViolation(error), true);
      return true;
    },
  );

  const found = await pg.query<{ code: string }>(
    "select code from games where lower(btrim(code)) = lower($1) limit 1",
    ["TIGERS"],
  );
  assert.equal(found.rows[0]?.code, "Tigers");

  await pg.query("insert into games (code, state, revision) values ($1, $2::jsonb, 1)", [
    "K7M4QP",
    state,
  ]);
  const legacy = await pg.query<{ code: string }>(
    "select code from games where lower(btrim(code)) = lower($1) limit 1",
    ["k7m4qp"],
  );
  assert.equal(legacy.rows[0]?.code, "K7M4QP");
});
