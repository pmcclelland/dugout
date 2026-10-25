import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  activePositions,
  balanceInning,
  emptyLineup,
  isSet,
  sampleGame,
  type Lineup,
  type Player,
  type PositionId,
} from "@/lib/lineup";
import { freshGame } from "@/lib/game-code";
import {
  alignBattingOrder,
  applyAvailability,
  availablePlayers,
  emptyGame,
  MAX_INNINGS,
  nextAvailableIndex,
  normalizeSnapshot,
  type DugoutState,
} from "@/lib/snapshot";

export type Snapshot = DugoutState;

type Persisted = Snapshot & { hint?: boolean };

type State = Snapshot & {
  hint: boolean;
  past: Snapshot[];
  setTeamName: (name: string) => void;
  setInningIndex: (index: number) => void;
  setTenField: (ten: boolean) => void;
  setInningsLength: (length: number) => void;
  addPlayer: (name: string, number: string) => void;
  updatePlayer: (id: string, patch: { name?: string; number?: string }) => void;
  removePlayer: (id: string) => void;
  move: (playerId: string, target: PositionId | "bench") => void;
  exchange: (a: string, b: string) => void;
  rebalance: () => void;
  nextInning: () => void;
  clearAssignments: () => void;
  clearPlayers: () => void;
  startNewGame: () => void;
  loadSample: () => void;
  setOut: (playerId: string, out: boolean) => void;
  reorderBatting: (order: string[]) => void;
  setAtBat: (playerId: string) => void;
  advanceBatter: () => void;
  applyRemote: (raw: unknown) => void;
  dismissHint: () => void;
  undo: () => void;
};

const HISTORY = 30;

function snapshot(s: Snapshot): Snapshot {
  return {
    teamName: s.teamName,
    players: s.players.map((p) => ({ ...p })),
    innings: s.innings.map((l) => ({ ...l })),
    inningIndex: s.inningIndex,
    tenField: s.tenField,
    battingOrder: [...s.battingOrder],
    batterIndex: s.batterIndex,
    outIds: [...s.outIds],
  };
}

function withHistory(s: State, next: Partial<Snapshot>): Partial<State> {
  return {
    ...next,
    past: [...s.past, snapshot(s)].slice(-HISTORY),
  };
}

function orderKeepingBatter(
  s: Snapshot,
  order: string[],
): Pick<Snapshot, "battingOrder" | "batterIndex"> {
  const battingOrder = alignBattingOrder(order, s.players);
  const currentId = s.battingOrder[s.batterIndex];
  const found = currentId ? battingOrder.indexOf(currentId) : -1;
  return { battingOrder, batterIndex: found >= 0 ? found : 0 };
}

function findPos(lineup: Lineup, playerId: string, tenField: boolean): PositionId | null {
  for (const pos of activePositions(tenField)) {
    if (lineup[pos.id] === playerId) return pos.id;
  }
  return null;
}

const initial = emptyGame();

export const useDugout = create<State>()(
  persist(
    (set, get) => ({
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
        const innings = s.innings.map((l) => ({ ...l, RV: ten ? l.RV : null }));
        set(withHistory(s, { tenField: ten, innings }));
      },
      setInningsLength: (length) => {
        const s = get();
        const n = Math.min(MAX_INNINGS, Math.max(1, length));
        if (n === s.innings.length) return;
        const innings =
          n < s.innings.length
            ? s.innings.slice(0, n).map((l) => ({ ...l }))
            : [
                ...s.innings.map((l) => ({ ...l })),
                ...Array.from({ length: n - s.innings.length }, () => emptyLineup()),
              ];
        set(
          withHistory(s, {
            innings,
            inningIndex: Math.min(s.inningIndex, innings.length - 1),
          }),
        );
      },
      addPlayer: (name, number) => {
        const s = get();
        const trimmed = name.trim();
        if (!trimmed || s.players.length >= 30) return;
        const player: Player = {
          id: crypto.randomUUID(),
          name: trimmed.slice(0, 32),
          number: number.trim().slice(0, 3),
          fromInning: s.inningIndex,
        };
        set(
          withHistory(s, {
            players: [...s.players, player],
            battingOrder: [...s.battingOrder, player.id],
          }),
        );
      },
      updatePlayer: (id, patch) => {
        const s = get();
        set(
          withHistory(s, {
            players: s.players.map((p) => {
              if (p.id !== id) return p;
              const name = patch.name !== undefined ? patch.name.trim().slice(0, 32) : p.name;
              const number =
                patch.number !== undefined ? patch.number.trim().slice(0, 3) : p.number;
              return { ...p, name: name || p.name, number };
            }),
          }),
        );
      },
      removePlayer: (id) => {
        const s = get();
        const battingOrder = s.battingOrder.filter((pid) => pid !== id);
        const removedAt = s.battingOrder.indexOf(id);
        let batterIndex = s.batterIndex;
        if (removedAt >= 0 && removedAt < batterIndex) batterIndex -= 1;
        if (batterIndex >= battingOrder.length) batterIndex = 0;
        if (batterIndex < 0) batterIndex = 0;
        set(
          withHistory(s, {
            players: s.players.filter((p) => p.id !== id),
            innings: s.innings.map((l) => {
              const next = { ...l };
              for (const pos of activePositions(true)) {
                if (next[pos.id] === id) next[pos.id] = null;
              }
              return next;
            }),
            battingOrder,
            batterIndex,
            outIds: s.outIds.filter((pid) => pid !== id),
          }),
        );
      },
      move: (playerId, target) => {
        const s = get();
        if (s.outIds.includes(playerId)) return;
        const current = s.innings[s.inningIndex];
        if (!current) return;
        const prev = findPos(current, playerId, s.tenField);
        if (target === "bench" && !prev) return;
        if (target !== "bench" && prev === target) return;
        const lineup = { ...current };
        for (const pos of activePositions(true)) {
          if (lineup[pos.id] === playerId) lineup[pos.id] = null;
        }
        if (target !== "bench") {
          const occupant = lineup[target];
          if (occupant && occupant !== playerId && prev) lineup[prev] = occupant;
          lineup[target] = playerId;
        }
        const innings = s.innings.map((l, i) => (i === s.inningIndex ? lineup : l));
        set(withHistory(s, { innings }));
      },
      exchange: (a, b) => {
        if (a === b) return;
        const s = get();
        if (s.outIds.includes(a) || s.outIds.includes(b)) return;
        const current = s.innings[s.inningIndex];
        if (!current) return;
        const posA = findPos(current, a, s.tenField);
        const posB = findPos(current, b, s.tenField);
        if (!posA && !posB) return;
        const lineup = { ...current };
        if (posA) lineup[posA] = b;
        if (posB) lineup[posB] = a;
        const innings = s.innings.map((l, i) => (i === s.inningIndex ? lineup : l));
        set(withHistory(s, { innings }));
      },
      rebalance: () => {
        const s = get();
        const lineup = balanceInning(
          availablePlayers(s.players, s.outIds),
          s.innings,
          s.inningIndex,
          s.tenField,
        );
        const innings = s.innings.map((l, i) => (i === s.inningIndex ? lineup : l));
        set(withHistory(s, { innings }));
      },
      nextInning: () => {
        const s = get();
        let innings = s.innings.map((l) => ({ ...l }));
        let index = s.inningIndex;
        if (index < innings.length - 1) {
          index += 1;
          const upcoming = innings[index];
          if (!upcoming || !isSet(upcoming)) {
            innings[index] = balanceInning(
              availablePlayers(s.players, s.outIds),
              innings,
              index,
              s.tenField,
            );
          }
        } else if (innings.length < MAX_INNINGS) {
          innings = [...innings, emptyLineup()];
          index = innings.length - 1;
          innings[index] = balanceInning(
            availablePlayers(s.players, s.outIds),
            innings,
            index,
            s.tenField,
          );
        } else {
          return;
        }
        set(withHistory(s, { innings, inningIndex: index }));
      },
      clearAssignments: () => {
        const s = get();
        set(
          withHistory(s, {
            innings: s.innings.map(() => emptyLineup()),
            inningIndex: 0,
          }),
        );
      },
      startNewGame: () => {
        const s = get();
        set(withHistory(s, freshGame(s)));
      },
      clearPlayers: () => {
        const s = get();
        set(
          withHistory(s, {
            players: [],
            innings: s.innings.map(() => emptyLineup()),
            battingOrder: [],
            batterIndex: 0,
            outIds: [],
          }),
        );
      },
      setOut: (playerId, out) => {
        const s = get();
        const next = applyAvailability(s, playerId, out);
        if (
          next.batterIndex === s.batterIndex &&
          next.outIds.length === s.outIds.length &&
          next.outIds.every((id, i) => id === s.outIds[i])
        ) {
          return;
        }
        set(withHistory(s, next));
      },
      loadSample: () => {
        const s = get();
        set({ ...withHistory(s, sampleGame()), hint: s.hint });
      },
      reorderBatting: (order) => {
        const s = get();
        const next = orderKeepingBatter(s, order);
        if (
          next.battingOrder.length === s.battingOrder.length &&
          next.battingOrder.every((id, i) => id === s.battingOrder[i])
        ) {
          return;
        }
        set(withHistory(s, next));
      },
      setAtBat: (playerId) => {
        const s = get();
        if (s.outIds.includes(playerId)) return;
        const index = s.battingOrder.indexOf(playerId);
        if (index < 0 || index === s.batterIndex) return;
        set(withHistory(s, { batterIndex: index }));
      },
      advanceBatter: () => {
        const s = get();
        if (s.battingOrder.length === 0) return;
        const next = nextAvailableIndex(s.battingOrder, s.batterIndex + 1, s.outIds);
        if (next === s.batterIndex) return;
        set(withHistory(s, { batterIndex: next }));
      },
      applyRemote: (raw) => {
        const next = normalizeSnapshot(raw);
        set({ ...next, past: [] });
      },
      undo: () => {
        const s = get();
        const prev = s.past[s.past.length - 1];
        if (!prev) return;
        set({
          ...prev,
          past: s.past.slice(0, -1),
          hint: s.hint,
        });
      },
    }),
    {
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
        outIds: s.outIds,
        hint: s.hint,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>;
        if (!Array.isArray(p.players)) return current;
        const next = normalizeSnapshot(p);
        return {
          ...current,
          ...next,
          hint: typeof p.hint === "boolean" ? p.hint : true,
          past: [],
        };
      },
    },
  ),
);
