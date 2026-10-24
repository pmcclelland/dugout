import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { a as emptyLineup, c as freshGame, d as moveInOrder, f as normalizeCode, g as shortName, h as sampleGame, i as balanceInning, l as isPositionId, m as positionOf, n as activePositions, o as fairness, p as normalizeSnapshot, r as alignBattingOrder, s as formatCode, u as isSet } from "./snapshot-lKaUT9AU.mjs";
import { a as ChevronDown, i as ChevronUp, r as GripVertical, t as Undo2 } from "../_libs/lucide-react.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DwhyADL7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn$1(...parts) {
	return parts.filter(Boolean).join(" ");
}
function indexAt(x, y) {
	const stack = document.elementsFromPoint(x, y);
	for (const el of stack) {
		if (!(el instanceof Element)) continue;
		if (el.closest("[data-ghost]")) continue;
		const row = el.closest("[data-order-index]");
		if (!row) continue;
		const value = Number(row.getAttribute("data-order-index"));
		return Number.isFinite(value) ? value : null;
	}
	return null;
}
function AtBatBar({ batter, onDeck, spot, onAdvance }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-3 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 lg:py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-widest text-muted",
				children: "AT BAT"
			}), batter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "truncate font-display text-xl leading-none tracking-wide lg:text-2xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: batter.number || "–"
					}),
					" ",
					batter.name,
					spot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: [" · ", spot]
					}) : null
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-sm text-muted",
				children: onDeck ? `On deck ${onDeck.name}` : "Last batter in the order"
			})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Add players to start a batting order."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "btn btn-primary shrink-0 px-3",
			disabled: !batter,
			onClick: onAdvance,
			children: "Next batter"
		})]
	});
}
function BattingCard({ players, order, batterIndex, lineup, tenField, onReorder, onSetAtBat }) {
	const [drag, setDrag] = (0, import_react.useState)(null);
	const dragRef = (0, import_react.useRef)(null);
	const origin = (0, import_react.useRef)({
		x: 0,
		y: 0,
		moved: false,
		armed: false
	});
	const assigned = lineup ? isSet(lineup) : false;
	const dragPlayer = drag ? players.find((player) => player.id === drag.id) : void 0;
	function spotOf(id) {
		if (!assigned || !lineup) return "—";
		return positionOf(lineup, id, tenField) ?? "Bench";
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-lg border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-wide",
					children: "Batting order"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted tabular-nums",
					children: [order.length, " hitters"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-pretty text-muted",
				children: "The order carries across innings. Press the handle and drag, or use the arrows. Tap a name to send them to the plate."
			}),
			order.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: "Nobody on the roster yet."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-2",
				children: order.map((id, index) => {
					const player = players.find((item) => item.id === id);
					if (!player) return null;
					const atBat = index === batterIndex;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						"data-order-index": index,
						className: cn$1("flex items-center gap-1 border-t border-border", drag?.over === index && "bg-surface", atBat && "bg-surface"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": `Drag ${player.name} to a new spot in the order`,
								className: "grid h-11 w-11 shrink-0 touch-none place-items-center text-muted",
								onPointerDown: (event) => {
									if (event.button !== 0) return;
									event.currentTarget.setPointerCapture(event.pointerId);
									origin.current = {
										x: event.clientX,
										y: event.clientY,
										moved: false,
										armed: true
									};
								},
								onPointerMove: (event) => {
									if (!origin.current.armed) return;
									if (event.pointerType === "mouse" && event.buttons !== 1) return;
									const dx = event.clientX - origin.current.x;
									const dy = event.clientY - origin.current.y;
									if (!origin.current.moved) {
										if (dx * dx + dy * dy < 64) return;
										origin.current.moved = true;
									}
									const next = {
										id,
										x: event.clientX,
										y: event.clientY,
										over: indexAt(event.clientX, event.clientY)
									};
									dragRef.current = next;
									setDrag(next);
								},
								onPointerUp: (event) => {
									const active = dragRef.current;
									if (origin.current.armed && origin.current.moved && active) {
										const target = indexAt(event.clientX, event.clientY);
										if (target !== null) onReorder(moveInOrder(order, active.id, target));
									}
									origin.current.moved = false;
									origin.current.armed = false;
									dragRef.current = null;
									setDrag(null);
								},
								onPointerCancel: () => {
									origin.current.moved = false;
									origin.current.armed = false;
									dragRef.current = null;
									setDrag(null);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn$1("w-6 shrink-0 text-center font-display text-2xl leading-none tabular-nums", atBat && "text-accent"),
								children: index + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex h-11 min-w-0 flex-1 items-center gap-2 text-left",
								"aria-pressed": atBat,
								onClick: () => onSetAtBat(id),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-8 shrink-0 text-center font-display text-2xl leading-none tabular-nums",
										children: player.number || "–"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "min-w-0 flex-1 truncate font-medium",
										children: player.name
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 font-display text-lg tracking-wide text-muted",
										children: spotOf(id)
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn h-11 w-11 shrink-0 px-0",
								"aria-label": `Move ${player.name} up`,
								disabled: index === 0,
								onClick: () => onReorder(moveInOrder(order, id, index - 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn h-11 w-11 shrink-0 px-0",
								"aria-label": `Move ${player.name} down`,
								disabled: index === order.length - 1,
								onClick: () => onReorder(moveInOrder(order, id, index + 1)),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
									className: "size-5",
									"aria-hidden": "true"
								})
							})
						]
					}, id);
				})
			}),
			drag && dragPlayer ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-ghost": true,
				className: "pointer-events-none fixed z-50 rounded-sm bg-chalk px-3 py-2 font-display text-xl shadow-chip",
				style: {
					left: drag.x,
					top: drag.y,
					transform: "translate(-20%, -120%)"
				},
				children: [
					dragPlayer.number || "–",
					" ",
					shortName(dragPlayer.name)
				]
			}) : null
		]
	});
}
function FieldArt() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 100 100",
		preserveAspectRatio: "none",
		className: "absolute inset-0 h-full w-full",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "100",
				height: "100",
				fill: "var(--color-grass)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				fill: "var(--color-grass-deep)",
				opacity: "0.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						y: "0",
						width: "100",
						height: "5.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						y: "11",
						width: "100",
						height: "5.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						y: "22",
						width: "100",
						height: "5"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M5 32 Q50 7 95 32",
				fill: "none",
				stroke: "var(--color-chalk)",
				strokeWidth: "1.4",
				strokeLinecap: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "50",
				y1: "94",
				x2: "8",
				y2: "30",
				stroke: "var(--color-chalk)",
				strokeWidth: "0.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: "50",
				y1: "94",
				x2: "92",
				y2: "30",
				stroke: "var(--color-chalk)",
				strokeWidth: "0.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "50,94 78,70 50,48 22,70",
				fill: "var(--color-dirt)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "50,86 68,70 50,56 32,70",
				fill: "var(--color-grass)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "50,86 68,70 50,56 32,70",
				fill: "none",
				stroke: "var(--color-chalk)",
				strokeWidth: "0.7"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "50",
				cy: "66",
				rx: "5.4",
				ry: "3.6",
				fill: "var(--color-dirt-deep)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "48.4",
				y: "65.2",
				width: "3.2",
				height: "1.2",
				fill: "var(--color-chalk)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "50,45.6 52.3,47.4 50,49.2 47.7,47.4",
				fill: "var(--color-chalk)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "78,68.2 80.3,70 78,71.8 75.7,70",
				fill: "var(--color-chalk)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "22,68.2 24.3,70 22,71.8 19.7,70",
				fill: "var(--color-chalk)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "50,91.4 47.4,91.4 47.4,93.6 50,96 52.6,93.6 52.6,91.4",
				fill: "var(--color-chalk)"
			})
		]
	});
}
function DugoutSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh flex-col px-4",
		"aria-busy": "true",
		"aria-label": "Loading Dugout",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "header-safe",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-24 animate-pulse rounded-sm bg-surface" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-3 h-10 w-48 animate-pulse rounded-sm bg-surface" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-4 h-11 w-full animate-pulse rounded-sm bg-surface" })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "field-slot",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "diamond",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 overflow-hidden rounded-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldArt, {})
				})
			})
		})]
	});
}
function snapshot(s) {
	return {
		teamName: s.teamName,
		players: s.players.map((p) => ({ ...p })),
		innings: s.innings.map((l) => ({ ...l })),
		inningIndex: s.inningIndex,
		tenField: s.tenField,
		battingOrder: [...s.battingOrder],
		batterIndex: s.batterIndex
	};
}
function withHistory(s, next) {
	return {
		...next,
		past: [...s.past, snapshot(s)].slice(-30)
	};
}
function orderKeepingBatter(s, order) {
	const battingOrder = alignBattingOrder(order, s.players);
	const currentId = s.battingOrder[s.batterIndex];
	const found = currentId ? battingOrder.indexOf(currentId) : -1;
	return {
		battingOrder,
		batterIndex: found >= 0 ? found : 0
	};
}
function findPos(lineup, playerId, tenField) {
	for (const pos of activePositions(tenField)) if (lineup[pos.id] === playerId) return pos.id;
	return null;
}
var initial = sampleGame();
var useDugout = create()(persist((set, get) => ({
	...initial,
	hint: true,
	past: [],
	setTeamName: (name) => set({ teamName: name.slice(0, 40) }),
	dismissHint: () => set({ hint: false }),
	setInningIndex: (index) => {
		const s = get();
		const next = Math.min(Math.max(0, index), s.innings.length - 1);
		if (next !== s.inningIndex) set({ inningIndex: next });
	},
	setTenField: (ten) => {
		const s = get();
		if (s.tenField === ten) return;
		set(withHistory(s, {
			tenField: ten,
			innings: s.innings.map((l) => ({
				...l,
				RV: ten ? l.RV : null
			}))
		}));
	},
	setInningsLength: (length) => {
		const s = get();
		const n = Math.min(12, Math.max(1, length));
		if (n === s.innings.length) return;
		const innings = n < s.innings.length ? s.innings.slice(0, n).map((l) => ({ ...l })) : [...s.innings.map((l) => ({ ...l })), ...Array.from({ length: n - s.innings.length }, () => emptyLineup())];
		set(withHistory(s, {
			innings,
			inningIndex: Math.min(s.inningIndex, innings.length - 1)
		}));
	},
	addPlayer: (name, number) => {
		const s = get();
		const trimmed = name.trim();
		if (!trimmed || s.players.length >= 30) return;
		const player = {
			id: crypto.randomUUID(),
			name: trimmed.slice(0, 32),
			number: number.trim().slice(0, 3),
			fromInning: s.inningIndex
		};
		set(withHistory(s, {
			players: [...s.players, player],
			battingOrder: [...s.battingOrder, player.id]
		}));
	},
	updatePlayer: (id, patch) => {
		const s = get();
		set(withHistory(s, { players: s.players.map((p) => {
			if (p.id !== id) return p;
			const name = patch.name !== void 0 ? patch.name.trim().slice(0, 32) : p.name;
			const number = patch.number !== void 0 ? patch.number.trim().slice(0, 3) : p.number;
			return {
				...p,
				name: name || p.name,
				number
			};
		}) }));
	},
	removePlayer: (id) => {
		const s = get();
		const battingOrder = s.battingOrder.filter((pid) => pid !== id);
		const removedAt = s.battingOrder.indexOf(id);
		let batterIndex = s.batterIndex;
		if (removedAt >= 0 && removedAt < batterIndex) batterIndex -= 1;
		if (batterIndex >= battingOrder.length) batterIndex = 0;
		if (batterIndex < 0) batterIndex = 0;
		set(withHistory(s, {
			players: s.players.filter((p) => p.id !== id),
			innings: s.innings.map((l) => {
				const next = { ...l };
				for (const pos of activePositions(true)) if (next[pos.id] === id) next[pos.id] = null;
				return next;
			}),
			battingOrder,
			batterIndex
		}));
	},
	move: (playerId, target) => {
		const s = get();
		const current = s.innings[s.inningIndex];
		if (!current) return;
		const prev = findPos(current, playerId, s.tenField);
		if (target === "bench" && !prev) return;
		if (target !== "bench" && prev === target) return;
		const lineup = { ...current };
		for (const pos of activePositions(true)) if (lineup[pos.id] === playerId) lineup[pos.id] = null;
		if (target !== "bench") {
			const occupant = lineup[target];
			if (occupant && occupant !== playerId && prev) lineup[prev] = occupant;
			lineup[target] = playerId;
		}
		set(withHistory(s, { innings: s.innings.map((l, i) => i === s.inningIndex ? lineup : l) }));
	},
	exchange: (a, b) => {
		if (a === b) return;
		const s = get();
		const current = s.innings[s.inningIndex];
		if (!current) return;
		const posA = findPos(current, a, s.tenField);
		const posB = findPos(current, b, s.tenField);
		if (!posA && !posB) return;
		const lineup = { ...current };
		if (posA) lineup[posA] = b;
		if (posB) lineup[posB] = a;
		set(withHistory(s, { innings: s.innings.map((l, i) => i === s.inningIndex ? lineup : l) }));
	},
	rebalance: () => {
		const s = get();
		const lineup = balanceInning(s.players, s.innings, s.inningIndex, s.tenField);
		set(withHistory(s, { innings: s.innings.map((l, i) => i === s.inningIndex ? lineup : l) }));
	},
	nextInning: () => {
		const s = get();
		let innings = s.innings.map((l) => ({ ...l }));
		let index = s.inningIndex;
		if (index < innings.length - 1) {
			index += 1;
			const upcoming = innings[index];
			if (!upcoming || !isSet(upcoming)) innings[index] = balanceInning(s.players, innings, index, s.tenField);
		} else if (innings.length < 12) {
			innings = [...innings, emptyLineup()];
			index = innings.length - 1;
			innings[index] = balanceInning(s.players, innings, index, s.tenField);
		} else return;
		set(withHistory(s, {
			innings,
			inningIndex: index
		}));
	},
	clearAssignments: () => {
		const s = get();
		set(withHistory(s, {
			innings: s.innings.map(() => emptyLineup()),
			inningIndex: 0
		}));
	},
	startNewGame: () => {
		const s = get();
		set(withHistory(s, freshGame(s)));
	},
	clearPlayers: () => {
		const s = get();
		set(withHistory(s, {
			players: [],
			innings: s.innings.map(() => emptyLineup()),
			battingOrder: [],
			batterIndex: 0
		}));
	},
	loadSample: () => {
		const s = get();
		set({
			...withHistory(s, sampleGame()),
			hint: s.hint
		});
	},
	reorderBatting: (order) => {
		const s = get();
		const next = orderKeepingBatter(s, order);
		if (next.battingOrder.length === s.battingOrder.length && next.battingOrder.every((id, i) => id === s.battingOrder[i])) return;
		set(withHistory(s, next));
	},
	setAtBat: (playerId) => {
		const s = get();
		const index = s.battingOrder.indexOf(playerId);
		if (index < 0 || index === s.batterIndex) return;
		set(withHistory(s, { batterIndex: index }));
	},
	advanceBatter: () => {
		const s = get();
		if (s.battingOrder.length === 0) return;
		set(withHistory(s, { batterIndex: (s.batterIndex + 1) % s.battingOrder.length }));
	},
	applyRemote: (raw) => {
		set({
			...normalizeSnapshot(raw),
			past: []
		});
	},
	undo: () => {
		const s = get();
		const prev = s.past[s.past.length - 1];
		if (!prev) return;
		set({
			...prev,
			past: s.past.slice(0, -1),
			hint: s.hint
		});
	}
}), {
	name: "dugout-v1",
	skipHydration: true,
	partialize: (s) => ({
		teamName: s.teamName,
		players: s.players,
		innings: s.innings,
		inningIndex: s.inningIndex,
		tenField: s.tenField,
		battingOrder: s.battingOrder,
		batterIndex: s.batterIndex,
		hint: s.hint
	}),
	merge: (persisted, current) => {
		const p = persisted ?? {};
		if (!Array.isArray(p.players)) return current;
		const next = normalizeSnapshot(p);
		return {
			...current,
			...next,
			hint: typeof p.hint === "boolean" ? p.hint : true,
			past: []
		};
	}
}));
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function isCodeInput(value) {
	return value !== null && typeof value === "object" && "code" in value;
}
function requireCode(input) {
	const raw = typeof input === "string" ? input : isCodeInput(input) && typeof input.code === "string" ? input.code : "";
	const code = normalizeCode(raw);
	if (!code) throw new Error("Invalid code");
	return code;
}
var createGame = createServerFn({ method: "POST" }).validator((input) => normalizeSnapshot(input)).handler(createSsrRpc("043cb08a0271156643101ee894e3032855aa81bff1f8052ed7a92d64a173fe4e"));
var loadGame = createServerFn({ method: "POST" }).validator((input) => requireCode(input)).handler(createSsrRpc("8fcc2c848e7957f92db64c152809d4c6485924bf6d90d12caa2761e2e2650fb8"));
var saveGame = createServerFn({ method: "POST" }).validator((input) => {
	if (!isCodeInput(input)) throw new Error("Invalid game");
	return {
		code: requireCode(input),
		state: normalizeSnapshot(input.state)
	};
}).handler(createSsrRpc("44a8e58fe150e316009c0d568d9e24d29f33304f66ad125b798ef49a1b4e1726"));
function pick(state) {
	return {
		teamName: state.teamName,
		players: state.players,
		innings: state.innings,
		inningIndex: state.inningIndex,
		tenField: state.tenField,
		battingOrder: state.battingOrder,
		batterIndex: state.batterIndex
	};
}
function sameState(a, b) {
	return JSON.stringify(pick(a)) === JSON.stringify(pick(b));
}
function useDugoutCloud(code, onMissing) {
	const [status, setStatus] = (0, import_react.useState)(code ? "loading" : "saved");
	const ready = (0, import_react.useRef)(false);
	const timer = (0, import_react.useRef)(0);
	const revision = (0, import_react.useRef)(0);
	const localGen = (0, import_react.useRef)(0);
	const savedGen = (0, import_react.useRef)(0);
	const applying = (0, import_react.useRef)(false);
	const onMissingRef = (0, import_react.useRef)(onMissing);
	onMissingRef.current = onMissing;
	(0, import_react.useEffect)(() => {
		if (!code) return;
		let cancelled = false;
		ready.current = false;
		revision.current = 0;
		localGen.current = 0;
		savedGen.current = 0;
		setStatus("loading");
		const unsub = useDugout.subscribe(() => {
			if (!applying.current) localGen.current += 1;
		});
		const pull = async () => {
			const remote = await loadGame({ data: { code } });
			if (cancelled || !remote) return;
			if (remote.revision === revision.current) return;
			if (localGen.current !== savedGen.current) return;
			applying.current = true;
			useDugout.getState().applyRemote(remote.state);
			applying.current = false;
			revision.current = remote.revision;
			savedGen.current = localGen.current;
		};
		(async () => {
			try {
				await useDugout.persist.rehydrate();
				if (cancelled) return;
				localGen.current = 0;
				savedGen.current = 0;
				const remote = await loadGame({ data: { code } });
				if (cancelled) return;
				if (!remote) {
					onMissingRef.current();
					return;
				}
				applying.current = true;
				useDugout.getState().applyRemote(remote.state);
				applying.current = false;
				revision.current = remote.revision;
				savedGen.current = localGen.current;
				ready.current = true;
				if (!cancelled) setStatus("saved");
			} catch {
				ready.current = true;
				if (!cancelled) setStatus("error");
			}
		})();
		const poll = window.setInterval(() => {
			if (!ready.current) return;
			pull().catch(() => {
				if (!cancelled) setStatus("error");
			});
		}, 2500);
		return () => {
			cancelled = true;
			ready.current = false;
			unsub();
			window.clearInterval(poll);
		};
	}, [code]);
	(0, import_react.useEffect)(() => {
		if (!code) return;
		const unsub = useDugout.subscribe((state, prev) => {
			if (!ready.current || applying.current || sameState(state, prev)) return;
			const gen = localGen.current;
			setStatus("saving");
			window.clearTimeout(timer.current);
			timer.current = window.setTimeout(() => {
				saveGame({ data: {
					code,
					state: pick(state)
				} }).then((result) => {
					revision.current = result.revision;
					if (localGen.current === gen) savedGen.current = gen;
					setStatus("saved");
				}).catch(() => setStatus("error"));
			}, 450);
		});
		return () => {
			unsub();
			window.clearTimeout(timer.current);
		};
	}, [code]);
	function retry() {
		if (!code || !ready.current) return;
		const gen = localGen.current;
		setStatus("saving");
		window.clearTimeout(timer.current);
		saveGame({ data: {
			code,
			state: pick(useDugout.getState())
		} }).then((result) => {
			revision.current = result.revision;
			if (localGen.current === gen) savedGen.current = gen;
			setStatus("saved");
		}).catch(() => setStatus("error"));
	}
	return {
		status,
		retry
	};
}
function cn(...parts) {
	return parts.filter(Boolean).join(" ");
}
function dropAt(x, y) {
	const stack = document.elementsFromPoint(x, y);
	for (const el of stack) {
		if (!(el instanceof Element)) continue;
		if (el.closest("[data-ghost]")) continue;
		const zone = el.closest("[data-drop]");
		if (zone) return zone.getAttribute("data-drop");
	}
	return null;
}
function DugoutApp({ code, onLeave, onMissing }) {
	const cloud = useDugoutCloud(code, onMissing);
	const teamName = useDugout((s) => s.teamName);
	const players = useDugout((s) => s.players);
	const innings = useDugout((s) => s.innings);
	const inningIndex = useDugout((s) => s.inningIndex);
	const tenField = useDugout((s) => s.tenField);
	const battingOrder = useDugout((s) => s.battingOrder);
	const batterIndex = useDugout((s) => s.batterIndex);
	const hint = useDugout((s) => s.hint);
	const canUndo = useDugout((s) => s.past.length > 0);
	const setInningIndex = useDugout((s) => s.setInningIndex);
	const setTenField = useDugout((s) => s.setTenField);
	const setInningsLength = useDugout((s) => s.setInningsLength);
	const addPlayer = useDugout((s) => s.addPlayer);
	const updatePlayer = useDugout((s) => s.updatePlayer);
	const removePlayer = useDugout((s) => s.removePlayer);
	const move = useDugout((s) => s.move);
	const exchange = useDugout((s) => s.exchange);
	const rebalance = useDugout((s) => s.rebalance);
	const nextInning = useDugout((s) => s.nextInning);
	const clearAssignments = useDugout((s) => s.clearAssignments);
	const clearPlayers = useDugout((s) => s.clearPlayers);
	const startNewGame = useDugout((s) => s.startNewGame);
	const loadSample = useDugout((s) => s.loadSample);
	const reorderBatting = useDugout((s) => s.reorderBatting);
	const setAtBat = useDugout((s) => s.setAtBat);
	const advanceBatter = useDugout((s) => s.advanceBatter);
	const dismissHint = useDugout((s) => s.dismissHint);
	const undo = useDugout((s) => s.undo);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [side, setSide] = (0, import_react.useState)("defense");
	const [drag, setDrag] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const dragRef = (0, import_react.useRef)(null);
	const origin = (0, import_react.useRef)({
		x: 0,
		y: 0,
		moved: false,
		armed: false
	});
	const suppressClick = (0, import_react.useRef)(false);
	const lineup = innings[inningIndex] ?? innings[0];
	const positions = activePositions(tenField);
	const setNow = lineup ? isSet(lineup) : false;
	const report = fairness(players, innings, tenField);
	const sitting = players.filter((p) => lineup && !positions.some((pos) => lineup[pos.id] === p.id));
	const previous = (() => {
		for (let i = inningIndex - 1; i >= 0; i--) {
			const inn = innings[i];
			if (inn && isSet(inn)) return inn;
		}
		return null;
	})();
	const dueIds = new Set(previous ? sitting.filter((p) => p.fromInning < inningIndex && !positions.some((pos) => previous[pos.id] === p.id)).map((p) => p.id) : []);
	function noteChange() {
		if (hint) dismissHint();
	}
	function onDrop(playerId, target) {
		if (target === "bench") move(playerId, "bench");
		else if (isPositionId(target)) move(playerId, target);
		setSelected(null);
		noteChange();
	}
	function onChipTap(id) {
		if (!lineup) return;
		if (!selected || selected === id) {
			setSelected(selected === id ? null : id);
			return;
		}
		const posS = positionOf(lineup, selected, tenField);
		const posT = positionOf(lineup, id, tenField);
		if (!posS && !posT) {
			setSelected(id);
			return;
		}
		exchange(selected, id);
		setSelected(null);
		noteChange();
	}
	function onEmptyTap(pos) {
		if (!selected) return;
		move(selected, pos);
		setSelected(null);
		noteChange();
	}
	function onBenchTap(event) {
		if (!selected) return;
		if (event.target.closest("[data-player]")) return;
		move(selected, "bench");
		setSelected(null);
		noteChange();
	}
	function pointerHandlers(playerId) {
		return {
			onPointerDown(event) {
				if (event.button !== 0) return;
				event.currentTarget.setPointerCapture(event.pointerId);
				origin.current = {
					x: event.clientX,
					y: event.clientY,
					moved: false,
					armed: true
				};
			},
			onPointerMove(event) {
				if (!origin.current.armed) return;
				if (event.pointerType === "mouse" && event.buttons !== 1) return;
				const dx = event.clientX - origin.current.x;
				const dy = event.clientY - origin.current.y;
				if (!origin.current.moved) {
					if (dx * dx + dy * dy < 64) return;
					origin.current.moved = true;
				}
				const over = dropAt(event.clientX, event.clientY);
				const next = {
					id: playerId,
					x: event.clientX,
					y: event.clientY,
					over
				};
				dragRef.current = next;
				setDrag(next);
			},
			onPointerUp(event) {
				const armed = origin.current.armed;
				const active = dragRef.current;
				if (armed && origin.current.moved && active) {
					const target = dropAt(event.clientX, event.clientY);
					if (target) onDrop(active.id, target);
				} else if (armed) onChipTap(playerId);
				suppressClick.current = true;
				origin.current.moved = false;
				origin.current.armed = false;
				dragRef.current = null;
				setDrag(null);
			},
			onPointerCancel() {
				origin.current.moved = false;
				origin.current.armed = false;
				dragRef.current = null;
				setDrag(null);
			},
			onClick() {
				if (suppressClick.current) {
					suppressClick.current = false;
					return;
				}
				onChipTap(playerId);
			}
		};
	}
	const dragPlayer = drag ? players.find((p) => p.id === drag.id) : void 0;
	const selectedPlayer = players.find((p) => p.id === selected);
	const batterId = battingOrder[batterIndex];
	const batter = batterId ? players.find((p) => p.id === batterId) : void 0;
	const onDeckId = battingOrder.length > 1 ? battingOrder[(batterIndex + 1) % battingOrder.length] : void 0;
	const onDeck = onDeckId ? players.find((p) => p.id === onDeckId) : void 0;
	const batterSpot = batter && lineup && isSet(lineup) ? positionOf(lineup, batter.id, tenField) ?? "Bench" : null;
	function copyCode() {
		navigator.clipboard?.writeText(code).then(() => {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1500);
		});
	}
	if (cloud.status === "loading") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DugoutSkeleton, {});
	const bench = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bench, {
		sitting,
		dueIds,
		selected,
		dragId: drag?.id ?? null,
		over: drag?.over ?? null,
		hasRoster: players.length > 0,
		atBatId: batter?.id ?? null,
		onBenchTap,
		pointerHandlers
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lg:flex lg:h-dvh lg:overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-h-svh flex-col overflow-x-hidden lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:min-w-0 lg:flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "header-safe shrink-0 px-4 pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "min-w-0 flex-1 truncate font-display text-3xl leading-none lg:text-4xl",
									children: teamName
								}), setNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-primary shrink-0 px-3",
									onClick: nextInning,
									children: "Next inning"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-primary shrink-0 px-3",
									onClick: rebalance,
									children: "Fill inning"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm text-pretty text-muted",
									children: [
										"Inning ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: inningIndex + 1
										}),
										" ",
										side === "defense" ? "defense" : "batting",
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: sitting.length
										}),
										" sitting",
										" · ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudNote, {
											status: cloud.status,
											onRetry: cloud.retry
										})
									]
								}), setNow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-quiet text-sm",
									onClick: rebalance,
									children: "Rebalance"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn-quiet text-sm",
									onClick: nextInning,
									children: "Skip"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-display text-xl tracking-wide",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm tracking-widest text-muted",
										children: "CODE "
									}), formatCode(code)]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn px-3 text-sm",
									onClick: copyCode,
									children: copied ? "Copied" : "Copy code"
								})]
							}),
							hint && side === "defense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 flex items-start justify-between gap-3 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-pretty",
									children: "Press and drag a player, or tap one and then tap a spot. Tap the bench to sit them."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "shrink-0 font-semibold text-foreground",
									onClick: dismissHint,
									children: "OK"
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex min-w-0 flex-1 gap-1 overflow-x-auto py-0.5",
										children: innings.map((inn, i) => {
											const filled = isSet(inn);
											const current = i === inningIndex;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												"aria-pressed": current,
												"aria-label": `Inning ${i + 1}${filled ? ", lineup set" : ", empty"}`,
												onClick: () => setInningIndex(i),
												className: cn("relative grid h-11 w-11 shrink-0 place-items-center rounded-sm font-display text-2xl tabular-nums", current ? "bg-accent text-accent-foreground" : "border border-border bg-card text-foreground"),
												children: [i + 1, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute bottom-1 h-1 w-1 rounded-full", filled ? "bg-current" : "border border-current bg-transparent") })]
											}, i);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex h-11 shrink-0 overflow-hidden rounded-sm border border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": !tenField,
											"aria-label": "Nine on the field",
											onClick: () => setTenField(false),
											className: cn("w-11 font-display text-xl", !tenField ? "bg-accent text-accent-foreground" : "bg-card text-foreground"),
											children: "9"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": tenField,
											"aria-label": "Ten on the field, with a rover",
											onClick: () => setTenField(true),
											className: cn("w-11 border-l border-border font-display text-xl", tenField ? "bg-accent text-accent-foreground" : "bg-card text-foreground"),
											children: "10"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn h-11 w-11 shrink-0 px-0",
										"aria-label": "Undo",
										disabled: !canUndo,
										onClick: () => {
											undo();
											setSelected(null);
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {
											className: "size-5",
											"aria-hidden": "true"
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 grid grid-cols-2 gap-1 rounded-sm border border-border p-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": side === "defense",
									onClick: () => setSide("defense"),
									className: cn("h-11 rounded-sm font-display text-xl tracking-wide", side === "defense" ? "bg-accent text-accent-foreground" : "text-foreground"),
									children: "Defense"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": side === "batting",
									onClick: () => setSide("batting"),
									className: cn("h-11 rounded-sm font-display text-xl tracking-wide", side === "batting" ? "bg-accent text-accent-foreground" : "text-foreground"),
									children: "Batting"
								})]
							}),
							selectedPlayer && side === "defense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-2 rounded-lg bg-foreground px-3 py-2 text-sm text-background",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: selectedPlayer.name
									}),
									" — tap a position, or a bench player to swap. ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "font-semibold underline",
										onClick: () => setSelected(null),
										children: "Cancel"
									})
								]
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtBatBar, {
						batter,
						onDeck,
						spot: batterSpot,
						onAdvance: advanceBatter
					}),
					side === "defense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "field-slot",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "diamond",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 overflow-hidden rounded-xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldArt, {})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
									className: "sr-only",
									children: [
										"Inning ",
										inningIndex + 1,
										" defensive positions"
									]
								}),
								positions.map((pos) => {
									const playerId = lineup?.[pos.id] ?? null;
									const player = playerId ? players.find((p) => p.id === playerId) : void 0;
									const hot = drag?.over === pos.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"data-drop": pos.id,
										style: {
											left: `${pos.x}%`,
											top: `${pos.y}%`
										},
										className: cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-md", hot && "outline-2 outline-offset-2 outline-chalk"),
										children: player ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerChip, {
											player,
											label: `${player.name}, number ${player.number || "unnumbered"}, ${pos.name}`,
											selected: selected === player.id,
											atBat: player.id === batter?.id,
											dimmed: drag?.id === player.id,
											handlers: pointerHandlers(player.id)
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => onEmptyTap(pos.id),
											"aria-label": `${pos.name}, empty${selectedPlayer ? `, place ${selectedPlayer.name}` : ""}`,
											className: "chip grid h-9 w-20 place-items-center rounded-sm border border-dashed border-chalk bg-grass-deep/50 text-chalk lg:h-11 lg:w-24",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-display text-lg leading-none tracking-wide lg:text-xl",
												children: pos.id
											})
										})
									}, pos.id);
								})
							]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BattingCard, {
							players,
							order: battingOrder,
							batterIndex,
							lineup,
							tenField,
							onReorder: reorderBatting,
							onSetAtBat: setAtBat
						})
					}),
					side === "defense" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "dock-safe shrink-0 px-3 lg:hidden",
						children: bench
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "border-border px-4 py-4 lg:h-dvh lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-l",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden lg:block",
						children: bench
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingTime, {
						players,
						innings,
						inningIndex,
						tenField,
						report,
						onJump: setInningIndex
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RosterEditor, {
						players,
						inningIndex,
						onAdd: addPlayer,
						onUpdate: updatePlayer,
						onRemove: removePlayer
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameSettings, {
						inningCount: innings.length,
						onLength: setInningsLength,
						onClearAssignments: clearAssignments,
						onClearPlayers: clearPlayers,
						onLoadSample: loadSample,
						onNewGame: startNewGame,
						onLeave
					})
				]
			}),
			drag && dragPlayer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-ghost": true,
				className: "pointer-events-none fixed z-50",
				style: {
					left: drag.x,
					top: drag.y,
					transform: "translate(-50%, -60%)"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerFace, {
					player: dragPlayer,
					lifted: true
				})
			}) : null
		]
	});
}
function CloudNote({ status, onRetry }) {
	if (status === "saving" || status === "loading") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saving" });
	if (status === "error") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "font-semibold text-warn",
		onClick: onRetry,
		children: "Not saved. Retry"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saved" });
}
function PlayerFace({ player, lifted = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("chip flex h-9 w-20 items-center gap-1 rounded-sm bg-chalk px-1 text-foreground lg:h-11 lg:w-24 lg:px-1.5", lifted && "scale-105"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-5 shrink-0 text-center font-display text-lg leading-none tabular-nums lg:w-7 lg:text-2xl",
			children: player.number || "–"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 flex-1 truncate text-left font-display text-sm leading-none tracking-wide lg:text-base",
			children: shortName(player.name)
		})]
	});
}
function PlayerChip({ player, label, selected, atBat = false, dimmed, due = false, wide = false, handlers }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		"data-player": player.id,
		"aria-label": label,
		"aria-pressed": selected,
		className: cn("chip flex items-center gap-1 rounded-sm bg-chalk px-1 text-left text-foreground lg:px-1.5", wide ? "h-9 w-auto min-w-20 max-w-full lg:h-11 lg:min-w-24" : "h-9 w-20 lg:h-11 lg:w-24", selected && "outline-2 outline-offset-2 outline-foreground", atBat && !selected && "outline-2 outline-offset-2 outline-accent", due && !selected && !atBat && "outline-2 outline-offset-2 outline-warn", dimmed && "opacity-40"),
		...handlers,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "w-5 shrink-0 text-center font-display text-lg leading-none tabular-nums lg:w-7 lg:text-2xl",
			children: player.number || "–"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "min-w-0 flex-1 truncate text-left font-display text-sm leading-none tracking-wide lg:text-base",
			children: wide ? player.name : shortName(player.name)
		})]
	});
}
function Bench({ sitting, dueIds, selected, dragId, over, hasRoster, atBatId, onBenchTap, pointerHandlers }) {
	const due = sitting.filter((p) => dueIds.has(p.id));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-drop": "bench",
		onClick: onBenchTap,
		className: cn("rounded-lg border border-border bg-card p-2 lg:p-3", over === "bench" && "outline-2 outline-offset-2 outline-accent"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-wide",
					children: "Bench"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted tabular-nums",
					children: over === "bench" ? "Drop to sit" : `${sitting.length} sitting`
				})]
			}),
			sitting.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-pretty text-muted",
				children: hasRoster ? "Everyone is in. Drop a player here to sit them out." : "Add your roster below, then drag players onto the diamond."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: sitting.map((player) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerChip, {
					player,
					wide: true,
					due: dueIds.has(player.id),
					selected: selected === player.id,
					atBat: player.id === atBatId,
					dimmed: dragId === player.id,
					label: `${player.name}, number ${player.number || "unnumbered"}, on the bench`,
					handlers: pointerHandlers(player.id)
				}, player.id))
			}),
			due.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-sm text-pretty text-warn",
				children: [
					"Sat last inning: ",
					due.map((p) => shortName(p.name)).join(", "),
					". Get them in if you can."
				]
			}) : null
		]
	});
}
function PlayingTime({ players, innings, inningIndex, tenField, report, onJump }) {
	const ordered = [...players].sort((a, b) => {
		const na = Number.parseInt(a.number, 10);
		const nb = Number.parseInt(b.number, 10);
		if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
		return a.name.localeCompare(b.name);
	});
	const names = report.backToBack.map((id) => players.find((p) => p.id === id)?.name).filter((name) => Boolean(name));
	const spots = activePositions(tenField);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-lg border border-border bg-card p-3 lg:mt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl tracking-wide",
					children: "Playing time"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted tabular-nums",
					children: players.length === 0 ? "No roster" : `Sat ${report.min}–${report.max}`
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-pretty text-muted",
				children: names.length ? `${names.join(", ")} sat back to back. Rebalance, or drag them in.` : "Filled squares are on the field. Tap one to open that inning."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-border",
				children: ordered.map((player) => {
					const stats = report.byPlayer[player.id] ?? {
						played: 0,
						sat: 0
					};
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 py-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-8 shrink-0 text-center font-display text-2xl leading-none tabular-nums",
								children: player.number || "–"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-medium",
									children: player.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "block text-xs text-muted tabular-nums",
									children: [
										stats.played,
										" played · ",
										stats.sat,
										" sat"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-1 overflow-x-auto",
								children: innings.map((inn, i) => {
									const filled = isSet(inn);
									const before = i < player.fromInning;
									const on = filled && spots.some((pos) => inn[pos.id] === player.id);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": before ? `Inning ${i + 1}, not on the roster yet` : `Inning ${i + 1}, ${!filled ? "not set" : on ? "playing" : "sitting"}`,
										onClick: () => onJump(i),
										className: cn("h-8 w-5 shrink-0 rounded-sm", before && "bg-surface", !before && !filled && "border border-dashed border-border", !before && filled && on && "bg-accent", !before && filled && !on && "border border-border bg-surface", i === inningIndex && "outline-2 outline-offset-1 outline-foreground")
									}, i);
								})
							})
						]
					}, player.id);
				})
			})
		]
	});
}
function RosterEditor({ players, inningIndex, onAdd, onUpdate, onRemove }) {
	const [name, setName] = (0, import_react.useState)("");
	const [number, setNumber] = (0, import_react.useState)("");
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const [draftNumber, setDraftNumber] = (0, import_react.useState)("");
	const [confirmId, setConfirmId] = (0, import_react.useState)(null);
	function startEdit(player) {
		setEditing(player.id);
		setDraftName(player.name);
		setDraftNumber(player.number);
		setConfirmId(null);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 rounded-lg border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-wide",
				children: "Roster"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: players.length
					}),
					" players. New kids join the end of the batting order at inning ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: inningIndex + 1
					}),
					" and are not charged for earlier sits."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3 flex gap-2",
				onSubmit: (event) => {
					event.preventDefault();
					if (!name.trim()) return;
					onAdd(name, number);
					setName("");
					setNumber("");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Player name",
						placeholder: "Player name",
						value: name,
						maxLength: 32,
						onChange: (event) => setName(event.target.value),
						className: "input min-w-0 flex-1"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Jersey number",
						placeholder: "#",
						inputMode: "numeric",
						value: number,
						maxLength: 3,
						onChange: (event) => setNumber(event.target.value),
						className: "input w-14 text-center font-display text-2xl"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn btn-primary shrink-0 px-3",
						children: "Add"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2",
				children: [...players].sort((a, b) => a.name.localeCompare(b.name)).map((player) => editing === player.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-t border-border py-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex flex-col gap-2",
						onSubmit: (event) => {
							event.preventDefault();
							onUpdate(player.id, {
								name: draftName,
								number: draftNumber
							});
							setEditing(null);
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Jersey number",
								value: draftNumber,
								maxLength: 3,
								onChange: (event) => setDraftNumber(event.target.value),
								className: "input w-16 shrink-0 text-center font-display text-2xl"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": "Player name",
								value: draftName,
								maxLength: 32,
								onChange: (event) => setDraftName(event.target.value),
								className: "input min-w-0 flex-1"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "btn btn-primary h-11 px-3",
									children: "Save"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn h-11 px-3",
									onClick: () => setEditing(null),
									children: "Cancel"
								}),
								confirmId === player.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "btn h-11 px-3 text-warn",
									onClick: () => {
										onRemove(player.id);
										setEditing(null);
									},
									children: ["Remove ", shortName(player.name)]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn h-11 px-3 text-warn",
									onClick: () => setConfirmId(player.id),
									children: "Remove"
								})
							]
						})]
					})
				}, player.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-t border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex min-h-11 w-full items-center gap-3 py-2 text-left",
						onClick: () => startEdit(player),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "w-8 text-center font-display text-2xl leading-none tabular-nums",
								children: player.number || "–"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "min-w-0 flex-1 truncate font-medium",
								children: player.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted",
								children: "Edit"
							})
						]
					})
				}, player.id))
			})
		]
	});
}
function GameSettings({ inningCount, onLength, onClearAssignments, onClearPlayers, onLoadSample, onNewGame, onLeave }) {
	const [confirm, setConfirm] = (0, import_react.useState)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4 mb-8 rounded-lg border border-border bg-card p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl tracking-wide",
				children: "Game"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm",
					children: "Innings in this game"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn h-11 w-11 px-0 font-display text-2xl",
							"aria-label": "Remove last inning",
							disabled: inningCount <= 1,
							onClick: () => onLength(inningCount - 1),
							children: "−"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-6 text-center font-display text-2xl tabular-nums",
							children: inningCount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn h-11 w-11 px-0 font-display text-2xl",
							"aria-label": "Add an inning",
							disabled: inningCount >= 12,
							onClick: () => onLength(inningCount + 1),
							children: "+"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: [
					confirm === "new" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => {
							onNewGame();
							setConfirm(null);
						},
						children: "Clear the field and start at the leadoff hitter"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-primary",
						onClick: () => setConfirm("new"),
						children: "New game"
					}),
					confirm === "sample" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => {
							onLoadSample();
							setConfirm(null);
						},
						children: "Replace with the sample Mudcats"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => setConfirm("sample"),
						children: "Load sample roster"
					}),
					confirm === "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => {
							onClearAssignments();
							setConfirm(null);
						},
						children: "Clear every inning’s positions"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => setConfirm("clear"),
						children: "Clear the lineup"
					}),
					confirm === "roster" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn text-warn",
						onClick: () => {
							onClearPlayers();
							setConfirm(null);
						},
						children: "Remove every player"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: () => setConfirm("roster"),
						children: "Clear roster"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn",
						onClick: onLeave,
						children: "Switch game"
					}),
					confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn-quiet text-sm",
						onClick: () => setConfirm(null),
						children: "Cancel"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-pretty text-muted",
				children: "Everyone with this code sees the same game. New game keeps the roster and batting order, clears the field, and sends the leadoff hitter up."
			})
		]
	});
}
function GameCodeScreen({ notice, onOpen }) {
	const [entry, setEntry] = (0, import_react.useState)("");
	const [teamName, setTeamName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(null);
	const name = teamName.trim().slice(0, 40);
	async function start() {
		if (!name) return;
		setBusy("start");
		setError(null);
		try {
			await useDugout.persist.rehydrate();
			const state = useDugout.getState();
			onOpen((await createGame({ data: {
				teamName: name,
				players: state.players,
				innings: state.innings,
				inningIndex: state.inningIndex,
				tenField: state.tenField,
				battingOrder: state.battingOrder,
				batterIndex: state.batterIndex
			} })).code);
		} catch {
			setError("Could not start a game. Try again.");
			setBusy(null);
		}
	}
	async function join(event) {
		event.preventDefault();
		const code = normalizeCode(entry);
		if (!code) {
			setError("Enter the 6-character code, like K7M-4QP.");
			return;
		}
		setBusy("join");
		setError(null);
		try {
			if (!await loadGame({ data: { code } })) {
				setError("No game with that code.");
				setBusy(null);
				return;
			}
			onOpen(code);
		} catch {
			setError("Could not open that game. Try again.");
			setBusy(null);
		}
	}
	const known = normalizeCode(entry);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center px-4 py-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative mb-6 h-44 overflow-hidden rounded-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FieldArt, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-sm tracking-widest text-muted",
					children: "DUGOUT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-5xl leading-none",
					children: "Name the team"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-pretty text-muted",
					children: "Then start a game and share the code. Any coach who joins sees the same lineup."
				}),
				notice ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-warn",
					children: notice
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-warn",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-6 block",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-sm tracking-widest text-muted",
						children: "TEAM NAME"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Team name",
						value: teamName,
						maxLength: 40,
						placeholder: "Mudcats",
						onChange: (event) => setTeamName(event.target.value),
						className: "input mt-1 w-full font-display text-3xl"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-primary mt-3 h-12 w-full",
					disabled: busy !== null || !name,
					onClick: () => void start(),
					children: busy === "start" ? "Starting…" : "Start a game"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 flex gap-2",
					onSubmit: (event) => void join(event),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						"aria-label": "Game code",
						value: entry,
						autoCapitalize: "characters",
						autoCorrect: "off",
						spellCheck: false,
						placeholder: "K7M-4QP",
						maxLength: 8,
						onChange: (event) => setEntry(event.target.value.toUpperCase()),
						className: "input min-w-0 flex-1 font-display text-2xl tracking-wide uppercase"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						className: "btn h-12 shrink-0 px-4",
						disabled: busy !== null || !known,
						children: busy === "join" ? "…" : "Join"
					})]
				}),
				known ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted",
					children: ["Joining ", formatCode(known)]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted",
					children: "Or join a game another coach already started."
				})
			]
		})
	});
}
var CODE_KEY = "dugout-game-code";
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	const [code, setCode] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const stored = normalizeCode(localStorage.getItem(CODE_KEY) ?? "");
		setCode(stored);
		setReady(true);
	}, []);
	function open(next) {
		localStorage.setItem(CODE_KEY, next);
		setNotice(null);
		setCode(next);
	}
	function leave(message) {
		localStorage.removeItem(CODE_KEY);
		setNotice(message ?? null);
		setCode(null);
	}
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DugoutSkeleton, {});
	if (!code) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameCodeScreen, {
		notice,
		onOpen: open
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DugoutApp, {
		code,
		onLeave: () => leave(),
		onMissing: () => leave("That game code is no longer available.")
	});
}
//#endregion
export { Home as component };
