//#region node_modules/.nitro/vite/services/ssr/assets/snapshot-lKaUT9AU.js
var POSITIONS = [
	{
		id: "CF",
		name: "Center field",
		x: 50,
		y: 10
	},
	{
		id: "LF",
		name: "Left field",
		x: 16,
		y: 24
	},
	{
		id: "RF",
		name: "Right field",
		x: 84,
		y: 24
	},
	{
		id: "RV",
		name: "Rover",
		x: 50,
		y: 36
	},
	{
		id: "SS",
		name: "Shortstop",
		x: 28,
		y: 50
	},
	{
		id: "2B",
		name: "Second base",
		x: 72,
		y: 50
	},
	{
		id: "3B",
		name: "Third base",
		x: 16,
		y: 74
	},
	{
		id: "P",
		name: "Pitcher",
		x: 50,
		y: 66
	},
	{
		id: "1B",
		name: "First base",
		x: 84,
		y: 74
	},
	{
		id: "C",
		name: "Catcher",
		x: 50,
		y: 88
	}
];
var ALL_POSITION_IDS = POSITIONS.map((p) => p.id);
var FILL_ORDER = [
	"LF",
	"CF",
	"RF",
	"1B",
	"2B",
	"SS",
	"3B",
	"RV",
	"C",
	"P"
];
function activePositions(tenField) {
	return tenField ? POSITIONS : POSITIONS.filter((p) => p.id !== "RV");
}
function isPositionId(value) {
	return ALL_POSITION_IDS.some((id) => id === value);
}
function emptyLineup() {
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
		RV: null
	};
}
function isSet(lineup) {
	return ALL_POSITION_IDS.some((id) => Boolean(lineup[id]));
}
function isOnField(lineup, playerId, tenField) {
	return activePositions(tenField).some((p) => lineup[p.id] === playerId);
}
function positionOf(lineup, playerId, tenField) {
	for (const p of activePositions(tenField)) if (lineup[p.id] === playerId) return p.id;
	return null;
}
function jerseySort(a, b) {
	const na = Number.parseInt(a.number, 10);
	const nb = Number.parseInt(b.number, 10);
	const aOk = Number.isFinite(na);
	const bOk = Number.isFinite(nb);
	if (aOk && bOk && na !== nb) return na - nb;
	if (aOk !== bOk) return aOk ? -1 : 1;
	return a.name.localeCompare(b.name);
}
function satStats(player, innings, index, tenField) {
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
	return {
		sits,
		eligible,
		satLast
	};
}
function balanceInning(players, innings, index, tenField) {
	const positions = activePositions(tenField);
	const lineup = emptyLineup();
	if (players.length === 0) return lineup;
	const sitN = Math.max(0, players.length - positions.length);
	const allNew = players.every((p) => satStats(p, innings, index, tenField).eligible === 0);
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
	let last = null;
	for (let i = index - 1; i >= 0; i--) {
		const prior = innings[i];
		if (prior && isSet(prior)) {
			last = prior;
			break;
		}
	}
	if (last) for (const pos of positions) {
		const pid = last[pos.id];
		if (pid && !sitters.has(pid) && players.some((p) => p.id === pid)) lineup[pos.id] = pid;
	}
	const placed = new Set(positions.map((p) => lineup[p.id]).filter((id) => Boolean(id)));
	const newcomers = players.filter((p) => !sitters.has(p.id) && !placed.has(p.id)).sort(jerseySort);
	const openings = FILL_ORDER.filter((id) => positions.some((p) => p.id === id) && !lineup[id]);
	newcomers.forEach((player, i) => {
		const slot = openings[i];
		if (slot) lineup[slot] = player.id;
	});
	return lineup;
}
function fairness(players, innings, tenField) {
	const byPlayer = {};
	const backToBack = [];
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
			if (isOnField(lineup, player.id, tenField)) {
				played += 1;
				prevSat = false;
			} else {
				sat += 1;
				if (prevSet && prevSat) backToBack.push(player.id);
				prevSat = true;
			}
			prevSet = true;
		}
		byPlayer[player.id] = {
			played,
			sat
		};
	}
	const sats = players.map((p) => byPlayer[p.id]?.sat ?? 0);
	return {
		min: sats.length ? Math.min(...sats) : 0,
		max: sats.length ? Math.max(...sats) : 0,
		backToBack: [...new Set(backToBack)],
		byPlayer
	};
}
function normalizeLineup(raw) {
	const lineup = emptyLineup();
	if (!raw) return lineup;
	for (const id of ALL_POSITION_IDS) {
		const value = raw[id];
		lineup[id] = typeof value === "string" && value ? value : null;
	}
	return lineup;
}
function shortName(name) {
	const parts = name.trim().split(/\s+/);
	return parts.length > 1 ? parts[parts.length - 1] ?? name : name;
}
var SAMPLE = [
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
	["Theo Park", "22"]
];
function samplePlayers() {
	return SAMPLE.map(([name, number], i) => ({
		id: `p${i + 1}`,
		name,
		number,
		fromInning: 0
	}));
}
function idByName(players, name) {
	const player = players.find((p) => p.name === name);
	if (!player) throw new Error(`Missing sample player ${name}`);
	return player.id;
}
function sampleGame() {
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
	const innings = [first];
	for (let i = 1; i < 6; i++) innings.push(balanceInning(players, innings, i, false));
	return {
		teamName: "Mudcats",
		players,
		innings,
		inningIndex: 0,
		tenField: false,
		battingOrder: players.map((player) => player.id),
		batterIndex: 0
	};
}
var GAME_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_RE = new RegExp(`^[${GAME_CODE_ALPHABET}]{6}$`);
function normalizeCode(raw) {
	const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
	return CODE_RE.test(compact) ? compact : null;
}
function formatCode(code) {
	return `${code.slice(0, 3)}-${code.slice(3)}`;
}
/** Keep the roster, team name, and batting order. Clear the field and the at-bat. */
function freshGame(state) {
	const count = Math.max(1, state.innings.length);
	return {
		innings: Array.from({ length: count }, () => emptyLineup()),
		inningIndex: 0,
		batterIndex: 0
	};
}
function isRecord(value) {
	return Boolean(value) && typeof value === "object";
}
function clampIndex(index, length) {
	if (length <= 0) return 0;
	if (typeof index !== "number" || !Number.isFinite(index)) return 0;
	return Math.min(length - 1, Math.max(0, Math.floor(index)));
}
function cleanPlayer(raw) {
	if (!isRecord(raw)) return null;
	if (typeof raw.id !== "string" || raw.id.length === 0 || raw.id.length > 80) return null;
	if (typeof raw.name !== "string") return null;
	const name = raw.name.trim().slice(0, 32);
	if (!name) return null;
	const number = typeof raw.number === "string" ? raw.number.trim().slice(0, 3) : "";
	const fromInning = typeof raw.fromInning === "number" && Number.isFinite(raw.fromInning) ? Math.min(11, Math.max(0, Math.floor(raw.fromInning))) : 0;
	return {
		id: raw.id,
		name,
		number,
		fromInning
	};
}
function alignBattingOrder(order, players) {
	const ids = new Set(players.map((player) => player.id));
	const next = [];
	const seen = /* @__PURE__ */ new Set();
	if (Array.isArray(order)) for (const id of order) {
		if (typeof id !== "string" || !ids.has(id) || seen.has(id)) continue;
		seen.add(id);
		next.push(id);
	}
	for (const player of players) if (!seen.has(player.id)) next.push(player.id);
	return next;
}
function cleanLineups(raw, ids, tenField) {
	return (Array.isArray(raw) && raw.length > 0 ? raw : [emptyLineup()]).slice(0, 12).map((item) => {
		const lineup = normalizeLineup(isRecord(item) ? item : null);
		const seen = /* @__PURE__ */ new Set();
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
function normalizeSnapshot(raw) {
	const source = isRecord(raw) ? raw : {};
	const players = [];
	const seen = /* @__PURE__ */ new Set();
	if (Array.isArray(source.players)) for (const item of source.players) {
		const player = cleanPlayer(item);
		if (!player || seen.has(player.id)) continue;
		seen.add(player.id);
		players.push(player);
		if (players.length >= 30) break;
	}
	const tenField = source.tenField === true;
	const ids = new Set(players.map((player) => player.id));
	const innings = cleanLineups(source.innings, ids, tenField);
	const battingOrder = alignBattingOrder(source.battingOrder, players);
	return {
		teamName: (typeof source.teamName === "string" ? source.teamName.trim().slice(0, 40) : "") || "Team",
		players,
		innings,
		inningIndex: clampIndex(source.inningIndex, innings.length),
		tenField,
		battingOrder,
		batterIndex: clampIndex(source.batterIndex, battingOrder.length)
	};
}
/** Move `id` so it lands at `toIndex`. No-op when that is already true. */
function moveInOrder(order, id, toIndex) {
	const from = order.indexOf(id);
	if (from < 0 || toIndex < 0 || toIndex >= order.length || from === toIndex) return order;
	const next = [...order];
	const [item] = next.splice(from, 1);
	if (!item) return order;
	next.splice(toIndex, 0, item);
	return next;
}
//#endregion
export { emptyLineup as a, freshGame as c, moveInOrder as d, normalizeCode as f, shortName as g, sampleGame as h, balanceInning as i, isPositionId as l, positionOf as m, activePositions as n, fairness as o, normalizeSnapshot as p, alignBattingOrder as r, formatCode as s, GAME_CODE_ALPHABET as t, isSet as u };
