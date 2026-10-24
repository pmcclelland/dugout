import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { isSet, positionOf, shortName, type Lineup, type Player } from "@/lib/lineup";
import { moveInOrder } from "@/lib/snapshot";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type DragPoint = { id: string; x: number; y: number; over: number | null };

function indexAt(x: number, y: number): number | null {
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

export function AtBatBar({
  batter,
  onDeck,
  spot,
  onAdvance,
}: {
  batter: Player | undefined;
  onDeck: Player | undefined;
  spot: string | null;
  onAdvance: () => void;
}) {
  return (
    <section className="mx-3 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 lg:py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-widest text-muted">AT BAT</p>
        {batter ? (
          <>
            <p className="truncate font-display text-xl leading-none tracking-wide lg:text-2xl">
              <span className="tabular-nums">{batter.number || "–"}</span> {batter.name}
              {spot ? <span className="text-muted"> · {spot}</span> : null}
            </p>
            <p className="truncate text-sm text-muted">
              {onDeck ? `On deck ${onDeck.name}` : "Last batter in the order"}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Add players to start a batting order.</p>
        )}
      </div>
      <button
        type="button"
        className="btn btn-primary shrink-0 px-3"
        disabled={!batter}
        onClick={onAdvance}
      >
        Next batter
      </button>
    </section>
  );
}

export function BattingCard({
  players,
  order,
  batterIndex,
  lineup,
  tenField,
  onReorder,
  onSetAtBat,
}: {
  players: Player[];
  order: string[];
  batterIndex: number;
  lineup: Lineup | undefined;
  tenField: boolean;
  onReorder: (order: string[]) => void;
  onSetAtBat: (id: string) => void;
}) {
  const [drag, setDrag] = useState<DragPoint | null>(null);
  const dragRef = useRef<DragPoint | null>(null);
  const origin = useRef({ x: 0, y: 0, moved: false, armed: false });
  const assigned = lineup ? isSet(lineup) : false;
  const dragPlayer = drag ? players.find((player) => player.id === drag.id) : undefined;

  function spotOf(id: string): string {
    if (!assigned || !lineup) return "—";
    return positionOf(lineup, id, tenField) ?? "Bench";
  }

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl tracking-wide">Batting order</h2>
        <p className="text-sm text-muted tabular-nums">{order.length} hitters</p>
      </div>
      <p className="mt-1 text-sm text-pretty text-muted">
        The order carries across innings. Press the handle and drag, or use the arrows. Tap a name to send them to the plate.
      </p>
      {order.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nobody on the roster yet.</p>
      ) : (
        <ol className="mt-2">
          {order.map((id, index) => {
            const player = players.find((item) => item.id === id);
            if (!player) return null;
            const atBat = index === batterIndex;
            return (
              <li
                key={id}
                data-order-index={index}
                className={cn(
                  "flex items-center gap-1 border-t border-border",
                  drag?.over === index && "bg-surface",
                  atBat && "bg-surface",
                )}
              >
                <button
                  type="button"
                  aria-label={`Drag ${player.name} to a new spot in the order`}
                  className="grid h-11 w-11 shrink-0 touch-none place-items-center text-muted"
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    origin.current = { x: event.clientX, y: event.clientY, moved: false, armed: true };
                  }}
                  onPointerMove={(event) => {
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
                      over: indexAt(event.clientX, event.clientY),
                    };
                    dragRef.current = next;
                    setDrag(next);
                  }}
                  onPointerUp={(event) => {
                    const active = dragRef.current;
                    if (origin.current.armed && origin.current.moved && active) {
                      const target = indexAt(event.clientX, event.clientY);
                      if (target !== null) onReorder(moveInOrder(order, active.id, target));
                    }
                    origin.current.moved = false;
                    origin.current.armed = false;
                    dragRef.current = null;
                    setDrag(null);
                  }}
                  onPointerCancel={() => {
                    origin.current.moved = false;
                    origin.current.armed = false;
                    dragRef.current = null;
                    setDrag(null);
                  }}
                >
                  <GripVertical className="size-5" aria-hidden="true" />
                </button>
                <span
                  className={cn(
                    "w-6 shrink-0 text-center font-display text-2xl leading-none tabular-nums",
                    atBat && "text-accent",
                  )}
                >
                  {index + 1}
                </span>
                <button
                  type="button"
                  className="flex h-11 min-w-0 flex-1 items-center gap-2 text-left"
                  aria-pressed={atBat}
                  onClick={() => onSetAtBat(id)}
                >
                  <span className="w-8 shrink-0 text-center font-display text-2xl leading-none tabular-nums">
                    {player.number || "–"}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
                  <span className="shrink-0 font-display text-lg tracking-wide text-muted">
                    {spotOf(id)}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn h-11 w-11 shrink-0 px-0"
                  aria-label={`Move ${player.name} up`}
                  disabled={index === 0}
                  onClick={() => onReorder(moveInOrder(order, id, index - 1))}
                >
                  <ChevronUp className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn h-11 w-11 shrink-0 px-0"
                  aria-label={`Move ${player.name} down`}
                  disabled={index === order.length - 1}
                  onClick={() => onReorder(moveInOrder(order, id, index + 1))}
                >
                  <ChevronDown className="size-5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {drag && dragPlayer ? (
        <div
          data-ghost
          className="pointer-events-none fixed z-50 rounded-sm bg-chalk px-3 py-2 font-display text-xl shadow-chip"
          style={{ left: drag.x, top: drag.y, transform: "translate(-20%, -120%)" }}
        >
          {dragPlayer.number || "–"} {shortName(dragPlayer.name)}
        </div>
      ) : null}
    </section>
  );
}
