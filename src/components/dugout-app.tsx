import { useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { AtBatBar, BattingCard } from "@/components/batting-card";
import { FieldArt } from "@/components/field-art";
import { DugoutSkeleton } from "@/components/sign-in-screen";
import { formatCode } from "@/lib/game-code";
import {
  activePositions,
  fairness,
  isPositionId,
  isSet,
  positionOf,
  shortName,
  type Player,
  type PositionId,
} from "@/lib/lineup";
import {
  armPointerOrigin,
  idlePointerOrigin,
  planPointerDragEnd,
  pointerHasMoved,
  type PointerDragEndKind,
} from "@/lib/pointer-drag";
import { useDugout } from "@/lib/store";
import { useDugoutCloud, type CloudStatus } from "@/lib/sync";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type DragPoint = { id: string; x: number; y: number; over: string | null };
type ChipHandlers = {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
  onClick: () => void;
};

function dropAt(x: number, y: number): string | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof Element)) continue;
    if (el.closest("[data-ghost]")) continue;
    const zone = el.closest("[data-drop]");
    if (zone) return zone.getAttribute("data-drop");
  }
  return null;
}

export function DugoutApp({
  code,
  onLeave,
  onMissing,
}: {
  code: string;
  onLeave: () => void;
  onMissing: () => void;
}) {
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

  const [selected, setSelected] = useState<string | null>(null);
  const [side, setSide] = useState<"defense" | "batting">("defense");
  const [drag, setDrag] = useState<DragPoint | null>(null);
  const [copied, setCopied] = useState(false);
  const dragRef = useRef<DragPoint | null>(null);
  const origin = useRef(idlePointerOrigin());
  const suppressClick = useRef(false);

  const lineup = innings[inningIndex] ?? innings[0];
  const positions = activePositions(tenField);
  const setNow = lineup ? isSet(lineup) : false;
  const report = fairness(players, innings, tenField);
  const sitting = players.filter(
    (p) => lineup && !positions.some((pos) => lineup[pos.id] === p.id),
  );
  const previous = (() => {
    for (let i = inningIndex - 1; i >= 0; i--) {
      const inn = innings[i];
      if (inn && isSet(inn)) return inn;
    }
    return null;
  })();
  const dueIds = new Set(
    previous
      ? sitting
          .filter(
            (p) =>
              p.fromInning < inningIndex && !positions.some((pos) => previous[pos.id] === p.id),
          )
          .map((p) => p.id)
      : [],
  );

  function noteChange() {
    if (hint) dismissHint();
  }

  function onDrop(playerId: string, target: string) {
    if (target === "bench") move(playerId, "bench");
    else if (isPositionId(target)) move(playerId, target);
    setSelected(null);
    noteChange();
  }

  function onChipTap(id: string) {
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

  function onEmptyTap(pos: PositionId) {
    if (!selected) return;
    move(selected, pos);
    setSelected(null);
    noteChange();
  }

  function onBenchTap(event: React.MouseEvent) {
    if (!selected) return;
    if ((event.target as Element).closest("[data-player]")) return;
    move(selected, "bench");
    setSelected(null);
    noteChange();
  }

  function finishPointer(
    kind: PointerDragEndKind,
    playerId: string,
    point?: { x: number; y: number },
  ) {
    const hadDrag = dragRef.current !== null;
    if (!origin.current.armed && !hadDrag) return;

    const plan = planPointerDragEnd(origin.current, hadDrag, kind);
    const active = dragRef.current;
    if (plan.tap) {
      onChipTap(playerId);
    } else if (plan.tryDrop && active) {
      const target = point ? dropAt(point.x, point.y) : active.over;
      if (target) onDrop(active.id, target);
    }
    if (plan.clearSelected) setSelected(null);
    if (plan.clearDrag) {
      origin.current = idlePointerOrigin();
      dragRef.current = null;
      setDrag(null);
    }
    suppressClick.current = true;
  }

  function pointerHandlers(playerId: string): ChipHandlers {
    return {
      onPointerDown(event) {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        origin.current = armPointerOrigin(event.clientX, event.clientY);
      },
      onPointerMove(event) {
        if (!origin.current.armed) return;
        if (event.pointerType === "mouse" && event.buttons !== 1) {
          finishPointer("up", playerId, { x: event.clientX, y: event.clientY });
          return;
        }
        if (!pointerHasMoved(origin.current, event.clientX, event.clientY)) return;
        origin.current.moved = true;
        const over = dropAt(event.clientX, event.clientY);
        const next = { id: playerId, x: event.clientX, y: event.clientY, over };
        dragRef.current = next;
        setDrag(next);
      },
      onPointerUp(event) {
        finishPointer("up", playerId, { x: event.clientX, y: event.clientY });
      },
      onPointerCancel() {
        finishPointer("cancel", playerId);
      },
      onLostPointerCapture() {
        finishPointer("lostcapture", playerId);
      },
      onClick() {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        onChipTap(playerId);
      },
    };
  }

  const dragPlayer = drag ? players.find((p) => p.id === drag.id) : undefined;
  const selectedPlayer = players.find((p) => p.id === selected);
  const batterId = battingOrder[batterIndex];
  const batter = batterId ? players.find((p) => p.id === batterId) : undefined;
  const onDeckId =
    battingOrder.length > 1 ? battingOrder[(batterIndex + 1) % battingOrder.length] : undefined;
  const onDeck = onDeckId ? players.find((p) => p.id === onDeckId) : undefined;
  const batterSpot =
    batter && lineup && isSet(lineup) ? (positionOf(lineup, batter.id, tenField) ?? "Bench") : null;

  function copyCode() {
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  if (cloud.status === "loading") return <DugoutSkeleton />;

  const bench = (
    <Bench
      sitting={sitting}
      dueIds={dueIds}
      selected={selected}
      dragId={drag?.id ?? null}
      over={drag?.over ?? null}
      hasRoster={players.length > 0}
      atBatId={batter?.id ?? null}
      onBenchTap={onBenchTap}
      pointerHandlers={pointerHandlers}
    />
  );

  return (
    <div className="lg:flex lg:h-dvh lg:overflow-hidden">
      <div className="flex min-h-svh flex-col overflow-x-hidden lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:min-w-0 lg:flex-1">
        <header className="header-safe shrink-0 px-4 pb-2">
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 flex-1 truncate font-display text-3xl leading-none lg:text-4xl">
              {teamName}
            </h1>
            {setNow ? (
              <button type="button" className="btn btn-primary shrink-0 px-3" onClick={nextInning}>
                Next inning
              </button>
            ) : (
              <button type="button" className="btn btn-primary shrink-0 px-3" onClick={rebalance}>
                Fill inning
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="text-sm text-pretty text-muted">
              Inning <span className="tabular-nums">{inningIndex + 1}</span>{" "}
              {side === "defense" ? "defense" : "batting"}
              {" · "}
              <span className="tabular-nums">{sitting.length}</span> sitting
              {" · "}
              <CloudNote status={cloud.status} onRetry={cloud.retry} />
            </div>
            {setNow ? (
              <button type="button" className="btn-quiet text-sm" onClick={rebalance}>
                Rebalance
              </button>
            ) : (
              <button type="button" className="btn-quiet text-sm" onClick={nextInning}>
                Skip
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="font-display text-xl tracking-wide">
              <span className="text-sm tracking-widest text-muted">CODE </span>
              {formatCode(code)}
            </p>
            <button type="button" className="btn px-3 text-sm" onClick={copyCode}>
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          {hint && side === "defense" ? (
            <p className="mt-1 flex items-start justify-between gap-3 text-sm text-muted">
              <span className="text-pretty">
                Press and drag a player, or tap one and then tap a spot. Tap the bench to sit them.
              </span>
              <button
                type="button"
                className="shrink-0 font-semibold text-foreground"
                onClick={dismissHint}
              >
                OK
              </button>
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-0.5">
              {innings.map((inn, i) => {
                const filled = isSet(inn);
                const current = i === inningIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={current}
                    aria-label={`Inning ${i + 1}${filled ? ", lineup set" : ", empty"}`}
                    onClick={() => setInningIndex(i)}
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-sm font-display text-2xl tabular-nums",
                      current
                        ? "bg-accent text-accent-foreground"
                        : "border border-border bg-card text-foreground",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="btn h-11 w-11 shrink-0 px-0"
              aria-label="Undo"
              disabled={!canUndo}
              onClick={() => {
                undo();
                setSelected(null);
              }}
            >
              <Undo2 className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-sm border border-border p-1">
            <button
              type="button"
              aria-pressed={side === "defense"}
              onClick={() => setSide("defense")}
              className={cn(
                "h-11 rounded-sm font-display text-xl tracking-wide",
                side === "defense" ? "bg-accent text-accent-foreground" : "text-foreground",
              )}
            >
              Defense
            </button>
            <button
              type="button"
              aria-pressed={side === "batting"}
              onClick={() => setSide("batting")}
              className={cn(
                "h-11 rounded-sm font-display text-xl tracking-wide",
                side === "batting" ? "bg-accent text-accent-foreground" : "text-foreground",
              )}
            >
              Batting
            </button>
          </div>
          {selectedPlayer && side === "defense" ? (
            <p className="mt-2 rounded-lg bg-foreground px-3 py-2 text-sm text-background">
              <span className="font-semibold">{selectedPlayer.name}</span>
              {" — tap a position, or a bench player to swap. "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
            </p>
          ) : null}
        </header>

        <AtBatBar batter={batter} onDeck={onDeck} spot={batterSpot} onAdvance={advanceBatter} />

        {side === "defense" ? (
          <div className="field-slot">
            <div className="diamond">
              <div className="absolute inset-0 overflow-hidden rounded-xl">
                <FieldArt />
              </div>
              <h2 className="sr-only">Inning {inningIndex + 1} defensive positions</h2>
              {positions.map((pos) => {
                const playerId = lineup?.[pos.id] ?? null;
                const player = playerId ? players.find((p) => p.id === playerId) : undefined;
                const hot = drag?.over === pos.id;
                return (
                  <div
                    key={pos.id}
                    data-drop={pos.id}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className={cn(
                      "absolute -translate-x-1/2 -translate-y-1/2 rounded-md",
                      hot && "outline-2 outline-offset-2 outline-chalk",
                    )}
                  >
                    {player ? (
                      <PlayerChip
                        player={player}
                        label={`${player.name}, number ${player.number || "unnumbered"}, ${pos.name}`}
                        selected={selected === player.id}
                        atBat={player.id === batter?.id}
                        dimmed={drag?.id === player.id}
                        handlers={pointerHandlers(player.id)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEmptyTap(pos.id)}
                        aria-label={`${pos.name}, empty${selectedPlayer ? `, place ${selectedPlayer.name}` : ""}`}
                        className="chip grid h-9 w-20 place-items-center rounded-sm border border-dashed border-chalk bg-grass-deep/50 text-chalk lg:h-11 lg:w-24"
                      >
                        <span className="font-display text-lg leading-none tracking-wide lg:text-xl">
                          {pos.id}
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <BattingCard
              players={players}
              order={battingOrder}
              batterIndex={batterIndex}
              lineup={lineup}
              tenField={tenField}
              onReorder={reorderBatting}
              onSetAtBat={setAtBat}
            />
          </div>
        )}

        {side === "defense" ? (
          <div className="dock-safe shrink-0 px-3 lg:hidden">{bench}</div>
        ) : null}
      </div>

      <aside className="border-border px-4 py-4 lg:h-dvh lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-l">
        <div className="hidden lg:block">{bench}</div>
        {side === "defense" ? (
          <PlayingTime players={players} innings={innings} tenField={tenField} report={report} />
        ) : null}
        <RosterEditor
          players={players}
          inningIndex={inningIndex}
          onAdd={addPlayer}
          onUpdate={updatePlayer}
          onRemove={removePlayer}
        />
        <GameSettings
          tenField={tenField}
          onTenField={setTenField}
          inningCount={innings.length}
          onLength={setInningsLength}
          onClearAssignments={clearAssignments}
          onClearPlayers={clearPlayers}
          onLoadSample={loadSample}
          onNewGame={startNewGame}
          onLeave={onLeave}
        />
      </aside>

      {drag && dragPlayer ? (
        <div
          data-ghost
          className="pointer-events-none fixed z-50"
          style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -60%)" }}
        >
          <PlayerFace player={dragPlayer} lifted />
        </div>
      ) : null}
    </div>
  );
}

function CloudNote({ status, onRetry }: { status: CloudStatus; onRetry: () => void }) {
  if (status === "saving" || status === "loading") return <span>Saving</span>;
  if (status === "error") {
    return (
      <button type="button" className="font-semibold text-warn" onClick={onRetry}>
        Not saved. Retry
      </button>
    );
  }
  return <span>Saved</span>;
}

function PlayerFace({ player, lifted = false }: { player: Player; lifted?: boolean }) {
  return (
    <span
      className={cn(
        "chip flex h-9 w-20 items-center gap-1 rounded-sm bg-chalk px-1 text-foreground lg:h-11 lg:w-24 lg:px-1.5",
        lifted && "scale-105",
      )}
    >
      <span className="w-5 shrink-0 text-center font-display text-lg leading-none tabular-nums lg:w-7 lg:text-2xl">
        {player.number || "–"}
      </span>
      <span className="min-w-0 flex-1 truncate text-left font-display text-sm leading-none tracking-wide lg:text-base">
        {shortName(player.name)}
      </span>
    </span>
  );
}

function PlayerChip({
  player,
  label,
  selected,
  atBat = false,
  dimmed,
  due = false,
  wide = false,
  handlers,
}: {
  player: Player;
  label: string;
  selected: boolean;
  atBat?: boolean;
  dimmed: boolean;
  due?: boolean;
  wide?: boolean;
  handlers: ChipHandlers;
}) {
  return (
    <button
      type="button"
      data-player={player.id}
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "chip flex items-center gap-1 rounded-sm bg-chalk px-1 text-left text-foreground lg:px-1.5",
        wide ? "h-9 w-auto min-w-20 max-w-full lg:h-11 lg:min-w-24" : "h-9 w-20 lg:h-11 lg:w-24",
        selected && "outline-2 outline-offset-2 outline-foreground",
        atBat && !selected && "outline-2 outline-offset-2 outline-accent",
        due && !selected && !atBat && "outline-2 outline-offset-2 outline-warn",
        dimmed && "opacity-40",
      )}
      {...handlers}
    >
      <span className="w-5 shrink-0 text-center font-display text-lg leading-none tabular-nums lg:w-7 lg:text-2xl">
        {player.number || "–"}
      </span>
      <span className="min-w-0 flex-1 truncate text-left font-display text-sm leading-none tracking-wide lg:text-base">
        {wide ? player.name : shortName(player.name)}
      </span>
    </button>
  );
}

function Bench({
  sitting,
  dueIds,
  selected,
  dragId,
  over,
  hasRoster,
  atBatId,
  onBenchTap,
  pointerHandlers,
}: {
  sitting: Player[];
  dueIds: Set<string>;
  selected: string | null;
  dragId: string | null;
  over: string | null;
  hasRoster: boolean;
  atBatId: string | null;
  onBenchTap: (event: React.MouseEvent) => void;
  pointerHandlers: (id: string) => ChipHandlers;
}) {
  const due = sitting.filter((p) => dueIds.has(p.id));
  return (
    <div
      data-drop="bench"
      onClick={onBenchTap}
      className={cn(
        "rounded-lg border border-border bg-card p-2 lg:p-3",
        over === "bench" && "outline-2 outline-offset-2 outline-accent",
      )}
    >
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl tracking-wide">Bench</h2>
        <p className="text-sm text-muted tabular-nums">
          {over === "bench" ? "Drop to sit" : `${sitting.length} sitting`}
        </p>
      </div>
      {sitting.length === 0 ? (
        <p className="text-sm text-pretty text-muted">
          {hasRoster
            ? "Everyone is in. Drop a player here to sit them out."
            : "Add your roster below, then drag players onto the diamond."}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sitting.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              wide
              due={dueIds.has(player.id)}
              selected={selected === player.id}
              atBat={player.id === atBatId}
              dimmed={dragId === player.id}
              label={`${player.name}, number ${player.number || "unnumbered"}, on the bench`}
              handlers={pointerHandlers(player.id)}
            />
          ))}
        </div>
      )}
      {due.length > 0 ? (
        <p className="mt-2 text-sm text-pretty text-warn">
          Sat last inning: {due.map((p) => shortName(p.name)).join(", ")}. Get them in if you can.
        </p>
      ) : null}
    </div>
  );
}

function PlayingTime({
  players,
  innings,
  tenField,
  report,
}: {
  players: Player[];
  innings: ReturnType<typeof useDugout.getState>["innings"];
  tenField: boolean;
  report: ReturnType<typeof fairness>;
}) {
  const ordered = [...players].sort((a, b) => {
    const na = Number.parseInt(a.number, 10);
    const nb = Number.parseInt(b.number, 10);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.name.localeCompare(b.name);
  });
  const names = report.backToBack
    .map((id) => players.find((p) => p.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const spots = activePositions(tenField);

  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-3 lg:mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl tracking-wide">Playing time</h2>
        <p className="text-sm text-muted tabular-nums">
          {players.length === 0 ? "No roster" : `Sat ${report.min}–${report.max}`}
        </p>
      </div>
      <p className="mt-1 text-sm text-pretty text-muted">
        {names.length
          ? `${names.join(", ")} sat back to back. Rebalance, or drag them in.`
          : "Filled squares show the position they played."}
      </p>
      <div className="mt-3 overflow-x-auto">
        <ul className="w-max min-w-full divide-y divide-border">
          {ordered.map((player) => {
            const stats = report.byPlayer[player.id] ?? { played: 0, sat: 0 };
            return (
              <li key={player.id} className="flex items-stretch gap-2">
                <span className="sticky left-0 z-10 flex w-36 shrink-0 items-center gap-2 bg-card py-2 shadow-[8px_0_0_0_var(--color-card)]">
                  <span className="w-8 shrink-0 text-center font-display text-2xl leading-none tabular-nums">
                    {player.number || "–"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{player.name}</span>
                    <span className="block text-xs text-muted tabular-nums">
                      {stats.played} played · {stats.sat} sat
                    </span>
                  </span>
                </span>
                <div className="flex items-center gap-1 py-2">
                  {innings.map((inn, i) => {
                    const filled = isSet(inn);
                    const before = i < player.fromInning;
                    const spot = filled
                      ? spots.find((pos) => inn[pos.id] === player.id)
                      : undefined;
                    return (
                      <span
                        key={i}
                        role="img"
                        aria-label={
                          before
                            ? `Inning ${i + 1}, not on the roster yet`
                            : !filled
                              ? `Inning ${i + 1}, not set`
                              : spot
                                ? `Inning ${i + 1}, ${spot.name}`
                                : `Inning ${i + 1}, sitting`
                        }
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-sm font-display text-sm leading-none tracking-wide",
                          before && "bg-surface",
                          !before && !filled && "border border-dashed border-border",
                          !before && filled && spot && "bg-accent text-accent-foreground",
                          !before && filled && !spot && "border border-border bg-surface",
                        )}
                      >
                        {spot ? spot.id : null}
                      </span>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function RosterEditor({
  players,
  inningIndex,
  onAdd,
  onUpdate,
  onRemove,
}: {
  players: Player[];
  inningIndex: number;
  onAdd: (name: string, number: string) => void;
  onUpdate: (id: string, patch: { name?: string; number?: string }) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftNumber, setDraftNumber] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function startEdit(player: Player) {
    setEditing(player.id);
    setDraftName(player.name);
    setDraftNumber(player.number);
    setConfirmId(null);
  }

  return (
    <section className="mt-4 rounded-lg border border-border bg-card p-3">
      <h2 className="font-display text-xl tracking-wide">Roster</h2>
      <p className="mt-1 text-sm text-muted">
        <span className="tabular-nums">{players.length}</span> players. New kids join the end of the
        batting order at inning <span className="tabular-nums">{inningIndex + 1}</span> and are not
        charged for earlier sits.
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onAdd(name, number);
          setName("");
          setNumber("");
        }}
      >
        <input
          aria-label="Player name"
          placeholder="Player name"
          value={name}
          maxLength={32}
          onChange={(event) => setName(event.target.value)}
          className="input min-w-0 flex-1"
        />
        <input
          aria-label="Jersey number"
          placeholder="#"
          inputMode="numeric"
          value={number}
          maxLength={3}
          onChange={(event) => setNumber(event.target.value)}
          className="input w-14 text-center font-display text-2xl"
        />
        <button type="submit" className="btn btn-primary shrink-0 px-3">
          Add
        </button>
      </form>
      <ul className="mt-2">
        {[...players]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((player) =>
            editing === player.id ? (
              <li key={player.id} className="border-t border-border py-2">
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    onUpdate(player.id, { name: draftName, number: draftNumber });
                    setEditing(null);
                  }}
                >
                  <div className="flex gap-2">
                    <input
                      aria-label="Jersey number"
                      value={draftNumber}
                      maxLength={3}
                      onChange={(event) => setDraftNumber(event.target.value)}
                      className="input w-16 shrink-0 text-center font-display text-2xl"
                    />
                    <input
                      aria-label="Player name"
                      value={draftName}
                      maxLength={32}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="input min-w-0 flex-1"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className="btn btn-primary h-11 px-3">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn h-11 px-3"
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                    {confirmId === player.id ? (
                      <button
                        type="button"
                        className="btn h-11 px-3 text-warn"
                        onClick={() => {
                          onRemove(player.id);
                          setEditing(null);
                        }}
                      >
                        Remove {shortName(player.name)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn h-11 px-3 text-warn"
                        onClick={() => setConfirmId(player.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </form>
              </li>
            ) : (
              <li key={player.id} className="border-t border-border">
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 py-2 text-left"
                  onClick={() => startEdit(player)}
                >
                  <span className="w-8 text-center font-display text-2xl leading-none tabular-nums">
                    {player.number || "–"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  <span className="text-sm text-muted">Edit</span>
                </button>
              </li>
            ),
          )}
      </ul>
    </section>
  );
}

function GameSettings({
  tenField,
  onTenField,
  inningCount,
  onLength,
  onClearAssignments,
  onClearPlayers,
  onLoadSample,
  onNewGame,
  onLeave,
}: {
  tenField: boolean;
  onTenField: (ten: boolean) => void;
  inningCount: number;
  onLength: (n: number) => void;
  onClearAssignments: () => void;
  onClearPlayers: () => void;
  onLoadSample: () => void;
  onNewGame: () => void;
  onLeave: () => void;
}) {
  const [confirm, setConfirm] = useState<"sample" | "clear" | "roster" | "new" | null>(null);
  return (
    <section className="mt-4 mb-8 rounded-lg border border-border bg-card p-3">
      <h2 className="font-display text-xl tracking-wide">Game</h2>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm">On the field</p>
        <div className="flex h-11 overflow-hidden rounded-sm border border-border">
          <button
            type="button"
            aria-pressed={!tenField}
            aria-label="Nine on the field"
            onClick={() => onTenField(false)}
            className={cn(
              "w-11 font-display text-xl",
              !tenField ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
            )}
          >
            9
          </button>
          <button
            type="button"
            aria-pressed={tenField}
            aria-label="Ten on the field, with a rover"
            onClick={() => onTenField(true)}
            className={cn(
              "w-11 border-l border-border font-display text-xl",
              tenField ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
            )}
          >
            10
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm">Innings in this game</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn h-11 w-11 px-0 font-display text-2xl"
            aria-label="Remove last inning"
            disabled={inningCount <= 1}
            onClick={() => onLength(inningCount - 1)}
          >
            −
          </button>
          <span className="w-6 text-center font-display text-2xl tabular-nums">{inningCount}</span>
          <button
            type="button"
            className="btn h-11 w-11 px-0 font-display text-2xl"
            aria-label="Add an inning"
            disabled={inningCount >= 12}
            onClick={() => onLength(inningCount + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {confirm === "new" ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onNewGame();
              setConfirm(null);
            }}
          >
            Clear the field and start at the leadoff hitter
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setConfirm("new")}>
            New game
          </button>
        )}
        {confirm === "sample" ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              onLoadSample();
              setConfirm(null);
            }}
          >
            Replace with the sample Mudcats
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirm("sample")}>
            Load sample roster
          </button>
        )}
        {confirm === "clear" ? (
          <button
            type="button"
            className="btn"
            onClick={() => {
              onClearAssignments();
              setConfirm(null);
            }}
          >
            Clear every inning’s positions
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirm("clear")}>
            Clear the lineup
          </button>
        )}
        {confirm === "roster" ? (
          <button
            type="button"
            className="btn text-warn"
            onClick={() => {
              onClearPlayers();
              setConfirm(null);
            }}
          >
            Remove every player
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => setConfirm("roster")}>
            Clear roster
          </button>
        )}
        <button type="button" className="btn" onClick={onLeave}>
          Switch game
        </button>
        {confirm ? (
          <button type="button" className="btn-quiet text-sm" onClick={() => setConfirm(null)}>
            Cancel
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-pretty text-muted">
        Everyone with this code sees the same game. New game keeps the roster and batting order,
        clears the field, and sends the leadoff hitter up.
      </p>
    </section>
  );
}
