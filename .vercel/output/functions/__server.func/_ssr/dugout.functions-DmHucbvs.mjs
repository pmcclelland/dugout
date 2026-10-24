import { n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { f as normalizeCode, p as normalizeSnapshot, t as GAME_CODE_ALPHABET } from "./snapshot-lKaUT9AU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dugout.functions-DmHucbvs.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function parseState(value) {
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return null;
	}
	return value;
}
function isCodeInput(value) {
	return value !== null && typeof value === "object" && "code" in value;
}
function requireCode(input) {
	const raw = typeof input === "string" ? input : isCodeInput(input) && typeof input.code === "string" ? input.code : "";
	const code = normalizeCode(raw);
	if (!code) throw new Error("Invalid code");
	return code;
}
function newCode() {
	const bytes = /* @__PURE__ */ new Uint8Array(6);
	crypto.getRandomValues(bytes);
	let code = "";
	for (const byte of bytes) code += GAME_CODE_ALPHABET[byte % GAME_CODE_ALPHABET.length];
	return code;
}
var createGame_createServerFn_handler = createServerRpc({
	id: "043cb08a0271156643101ee894e3032855aa81bff1f8052ed7a92d64a173fe4e",
	name: "createGame",
	filename: "src/lib/dugout.functions.ts"
}, (opts) => createGame.__executeServer(opts));
var createGame = createServerFn({ method: "POST" }).validator((input) => normalizeSnapshot(input)).handler(createGame_createServerFn_handler, async ({ data }) => {
	const { getSql } = await import("./db-nBL9m5eU.mjs").then((n) => n.t);
	const sql = await getSql();
	const payload = JSON.stringify(data);
	for (let attempt = 0; attempt < 5; attempt += 1) {
		const code = newCode();
		if ((await sql`
        insert into games (code, state, revision)
        values (${code}, ${payload}::jsonb, 1)
        on conflict (code) do nothing
        returning code
      `)[0]) return {
			code,
			revision: 1
		};
	}
	throw new Error("Could not start a game");
});
var loadGame_createServerFn_handler = createServerRpc({
	id: "8fcc2c848e7957f92db64c152809d4c6485924bf6d90d12caa2761e2e2650fb8",
	name: "loadGame",
	filename: "src/lib/dugout.functions.ts"
}, (opts) => loadGame.__executeServer(opts));
var loadGame = createServerFn({ method: "POST" }).validator((input) => requireCode(input)).handler(loadGame_createServerFn_handler, async ({ data }) => {
	const { getSql } = await import("./db-nBL9m5eU.mjs").then((n) => n.t);
	const row = (await (await getSql())`
      select state, revision from games where code = ${data} limit 1
    `)[0];
	if (!row) return null;
	return {
		state: normalizeSnapshot(parseState(row.state)),
		revision: Number(row.revision)
	};
});
var saveGame_createServerFn_handler = createServerRpc({
	id: "44a8e58fe150e316009c0d568d9e24d29f33304f66ad125b798ef49a1b4e1726",
	name: "saveGame",
	filename: "src/lib/dugout.functions.ts"
}, (opts) => saveGame.__executeServer(opts));
var saveGame = createServerFn({ method: "POST" }).validator((input) => {
	if (!isCodeInput(input)) throw new Error("Invalid game");
	return {
		code: requireCode(input),
		state: normalizeSnapshot(input.state)
	};
}).handler(saveGame_createServerFn_handler, async ({ data }) => {
	const { getSql } = await import("./db-nBL9m5eU.mjs").then((n) => n.t);
	const row = (await (await getSql())`
      update games
      set state = ${JSON.stringify(data.state)}::jsonb,
          revision = revision + 1,
          updated_at = now()
      where code = ${data.code}
      returning revision
    `)[0];
	if (!row) throw new Error("Game not found");
	return { revision: Number(row.revision) };
});
//#endregion
export { createGame_createServerFn_handler, loadGame_createServerFn_handler, saveGame_createServerFn_handler };
