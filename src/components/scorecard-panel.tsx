import { useState } from "react";
import { Undo2 } from "lucide-react";
import { FieldArt } from "@/components/field-art";
import { shortName, type Player } from "@/lib/lineup";
import {
  applyDraft,
  boxScore,
  defaultBasesReached,
  gameTally,
  lineScore,
  liveScoring,
  notationsFor,
  opponentTotal,
  pitchCount,
  playNotation,
  SCORE_SPOTS,
  teamBox,
  type AtBatResult,
  type FieldPos,
  type OutKind,
  type PlayDraft,
  type RunnerBag,
  type Scorecard,
} from "@/lib/scorecard";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const RESULTS: Array<{ result: AtBatResult; label: string }> = [
  { result: "1B", label: "1B" },
  { result: "2B", label: "2B" },
  { result: "3B", label: "3B" },
  { result: "HR", label: "HR" },
  { result: "BB", label: "BB" },
  { result: "HBP", label: "HBP" },
  { result: "K", label: "K" },
  { result: "KL", label: "ꓘ" },
  { result: "E", label: "E" },
  { result: "FC", label: "FC" },
  { result: "OUT", label: "Out" },
];

type Pending = {
  result: AtBatResult;
  positions: FieldPos[];
  outKind: OutKind;
  runnersOut: RunnerBag[];
};

function emptyPending(result: AtBatResult): Pending {
  return {
    result,
    positions: [],
    outKind: result === "OUT" ? "fly" : "ground",
    runnersOut: result === "OUT" || result === "K" || result === "KL" ? ["batter"] : [],
  };
}

function needsDiamond(result: AtBatResult): boolean {
  return result === "OUT" || result === "E" || result === "FC";
}

export function ScorecardPanel({
  teamName,
  players,
  order,
  batter,
  onDeck,
  scorecard,
  scheduledInnings,
  pitcher,
  closed,
  onRecord,
  onUndoPlay,
  onOpponentRun,
  onPitch,
  onCloseGame,
}: {
  teamName: string;
  players: Player[];
  order: string[];
  batter: Player | undefined;
  onDeck: Player | undefined;
  scorecard: Scorecard;
  scheduledInnings: number;
  pitcher: Player | undefined;
  closed: boolean;
  onRecord: (draft: PlayDraft) => void;
  onUndoPlay: () => void;
  onOpponentRun: (inning: number, runs: number) => void;
  onPitch: (playerId: string, delta: number) => void;
  onCloseGame: (closed: boolean) => void;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [showBox, setShowBox] = useState(closed);
  const live = liveScoring(scorecard.plays);
  const us = gameTally(scorecard.plays);
  const them = opponentTotal(scorecard.opponentRuns);
  const last = scorecard.plays[scorecard.plays.length - 1];
  const lastBatter = last ? players.find((player) => player.id === last.batterId) : undefined;
  const lines = lineScore(scorecard.plays, scheduledInnings);
  const byId = new Map(players.map((player) => [player.id, player]));

  function commit(next: Pending) {
    onRecord({
      result: next.result,
      positions: next.positions,
      outKind: next.result === "OUT" ? next.outKind : undefined,
      runnersOut: next.runnersOut.length ? next.runnersOut : undefined,
    });
    setPending(null);
  }

  function pickResult(result: AtBatResult) {
    if (closed || !batter) return;
    if (needsDiamond(result)) {
      const start = emptyPending(result);
      if (result === "FC" && live.bases.first) start.runnersOut = ["first"];
      setPending(start);
      return;
    }
    commit(emptyPending(result));
  }

  function toggleRunner(bag: RunnerBag) {
    if (!pending) return;
    const has = pending.runnersOut.includes(bag);
    const runnersOut = has
      ? pending.runnersOut.filter((item) => item !== bag)
      : [...pending.runnersOut, bag];
    setPending({ ...pending, runnersOut });
  }

  function tapSpot(num: FieldPos) {
    if (!pending) return;
    if (pending.result === "E") {
      setPending({ ...pending, positions: [num] });
      return;
    }
    setPending({ ...pending, positions: [...pending.positions, num] });
  }

  const preview = pending
    ? applyDraft(live.bases, batter?.id ?? "", pending)
    : null;
  const previewNotation = pending ? playNotation(pending) : "";
  const canRecordOut = Boolean(
    pending &&
      (pending.result !== "OUT" || pending.positions.length > 0 || pending.runnersOut.length > 0),
  );

  if (closed || showBox) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <BoxScoreView
          teamName={teamName}
          players={players}
          order={order}
          scorecard={scorecard}
          scheduledInnings={scheduledInnings}
          closed={closed}
          onBack={() => setShowBox(false)}
          onResume={() => {
            onCloseGame(false);
            setShowBox(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <section className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <ScoreSide name={teamName} runs={us.runs} hits={us.hits} ours />
          <div className="text-center">
            <p className="text-xs font-semibold tracking-widest text-muted">INNING</p>
            <p className="font-display text-3xl leading-none tabular-nums">{live.inning + 1}</p>
            <p className="text-sm text-muted tabular-nums">
              {live.outs} {live.outs === 1 ? "out" : "outs"}
            </p>
          </div>
          <ScoreSide
            name="Them"
            runs={them}
            hits={null}
            ours={false}
            onPlus={() => onOpponentRun(live.inning, (scorecard.opponentRuns[live.inning] ?? 0) + 1)}
            onMinus={() => onOpponentRun(live.inning, (scorecard.opponentRuns[live.inning] ?? 0) - 1)}
          />
        </div>
        <BasesRow
          bases={live.bases}
          players={players}
          reached={
            pending && batter
              ? defaultBasesReached(pending.result)
              : last
                ? last.basesReached
                : 0
          }
        />
        {scorecard.trackPitches && pitcher ? (
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
            <p className="min-w-0 truncate text-sm">
              <span className="text-xs font-semibold tracking-widest text-muted">PITCHES </span>
              {pitcher.number || "–"} {pitcher.name}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn h-11 w-11 px-0 font-display text-2xl"
                aria-label="Remove a pitch"
                onClick={() => onPitch(pitcher.id, -1)}
              >
                −
              </button>
              <span className="w-8 text-center font-display text-2xl tabular-nums">
                {pitchCount(scorecard.pitches, pitcher.id)}
              </span>
              <button
                type="button"
                className="btn h-11 w-11 px-0 font-display text-2xl"
                aria-label="Add a pitch"
                onClick={() => onPitch(pitcher.id, 1)}
              >
                +
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-semibold tracking-widest text-muted">AT BAT</p>
        {batter ? (
          <>
            <p className="truncate font-display text-3xl leading-none tracking-wide">
              <span className="tabular-nums">{batter.number || "–"}</span> {batter.name}
            </p>
            <p className="truncate text-sm text-muted">
              {onDeck ? `On deck ${onDeck.name}` : "Last batter in the order"}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Add players, then record from the top of the order.</p>
        )}

        {pending ? (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl tracking-wide">
                {pending.result === "OUT" ? "Who fielded it" : pending.result === "E" ? "Who erred" : "The throw"}
              </p>
              <button type="button" className="btn-quiet text-sm" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
            {pending.result === "OUT" ? (
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-sm border border-border p-1">
                {(["fly", "line", "ground"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={pending.outKind === kind}
                    onClick={() => setPending({ ...pending, outKind: kind })}
                    className={cn(
                      "h-11 rounded-sm font-display text-xl tracking-wide capitalize",
                      pending.outKind === kind
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-sm text-muted">
              Tap the positions in order. SS then 1B becomes 6-3.
            </p>
            <div className="relative mx-auto mt-2 w-full max-w-sm">
              <div className="relative aspect-[0.78] overflow-hidden rounded-xl">
                <FieldArt />
                {SCORE_SPOTS.map((spot) => {
                  const orderIndex = pending.positions.indexOf(spot.num);
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => tapSpot(spot.num)}
                      aria-label={`${spot.id}, position ${spot.num}`}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      className={cn(
                        "absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-sm font-display leading-none",
                        orderIndex >= 0
                          ? "bg-accent text-accent-foreground"
                          : "border border-chalk bg-grass-deep/70 text-chalk",
                      )}
                    >
                      <span className="text-lg">{spot.id}</span>
                      <span className="text-[0.65rem] tabular-nums opacity-80">
                        {orderIndex >= 0 ? orderIndex + 1 : spot.num}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="font-display text-2xl tracking-wide">
                {previewNotation || "—"}
              </p>
              <button
                type="button"
                className="btn h-11 px-3"
                disabled={pending.positions.length === 0}
                onClick={() =>
                  setPending({ ...pending, positions: pending.positions.slice(0, -1) })
                }
              >
                Untap
              </button>
            </div>
            <div className="mt-2">
              <p className="text-xs font-semibold tracking-widest text-muted">WHO WAS OUT</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <RunnerToggle
                  label={batter ? `${shortName(batter.name)} (batter)` : "Batter"}
                  pressed={pending.runnersOut.includes("batter")}
                  onClick={() => toggleRunner("batter")}
                />
                {live.bases.first ? (
                  <RunnerToggle
                    label={`${shortName(byId.get(live.bases.first)?.name ?? "1st")} 1st`}
                    pressed={pending.runnersOut.includes("first")}
                    onClick={() => toggleRunner("first")}
                  />
                ) : null}
                {live.bases.second ? (
                  <RunnerToggle
                    label={`${shortName(byId.get(live.bases.second)?.name ?? "2nd")} 2nd`}
                    pressed={pending.runnersOut.includes("second")}
                    onClick={() => toggleRunner("second")}
                  />
                ) : null}
                {live.bases.third ? (
                  <RunnerToggle
                    label={`${shortName(byId.get(live.bases.third)?.name ?? "3rd")} 3rd`}
                    pressed={pending.runnersOut.includes("third")}
                    onClick={() => toggleRunner("third")}
                  />
                ) : null}
              </div>
              <p className="mt-2 text-sm text-muted tabular-nums">
                {preview?.outs ?? 0} {(preview?.outs ?? 0) === 1 ? "out" : "outs"} this play
                {preview && preview.scoredIds.length
                  ? ` · ${preview.scoredIds.length} run`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary mt-3 w-full"
              disabled={!canRecordOut}
              onClick={() => pending && commit(pending)}
            >
              Record {previewNotation || "play"}
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-1">
            {RESULTS.map((item) => (
              <button
                key={item.result}
                type="button"
                disabled={!batter}
                aria-label={item.result === "OUT" ? "Record an out" : item.label}
                onClick={() => pickResult(item.result)}
                className={cn(
                  "btn h-12 px-0 font-display text-xl tracking-wide",
                  item.result === "OUT" && "col-span-2 btn-primary",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {last ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <p className="min-w-0 flex-1 text-sm text-pretty">
            Last{" "}
            <span className="font-semibold">
              {lastBatter ? shortName(lastBatter.name) : "batter"} {last.notation}
            </span>
            {last.scoredIds.length ? ` · ${last.scoredIds.length} run` : ""}
            {last.rbis ? ` · ${last.rbis} RBI` : ""}
          </p>
          <button
            type="button"
            className="btn h-11 shrink-0 px-3"
            aria-label="Undo last play"
            onClick={onUndoPlay}
          >
            <Undo2 className="size-5" aria-hidden="true" />
            Undo
          </button>
        </div>
      ) : null}

      <ScoreGrid
        order={order}
        players={players}
        scorecard={scorecard}
        innings={lines.length}
      />

      <div className="mt-3 flex gap-2">
        <button type="button" className="btn flex-1" onClick={() => setShowBox(true)}>
          Box score
        </button>
        <button type="button" className="btn btn-primary flex-1" onClick={() => onCloseGame(true)}>
          End game
        </button>
      </div>
    </div>
  );
}

function ScoreSide({
  name,
  runs,
  hits,
  ours,
  onPlus,
  onMinus,
}: {
  name: string;
  runs: number;
  hits: number | null;
  ours: boolean;
  onPlus?: () => void;
  onMinus?: () => void;
}) {
  return (
    <div className={cn("min-w-0 flex-1", ours ? "text-left" : "text-right")}>
      <p className="truncate text-xs font-semibold tracking-widest text-muted">
        {ours ? "US" : "THEM"}
      </p>
      <p className="truncate font-display text-base leading-none">{name}</p>
      <p className="font-display text-4xl leading-none tabular-nums">{runs}</p>
      {hits !== null ? (
        <p className="text-sm text-muted tabular-nums">{hits} hits</p>
      ) : onPlus && onMinus ? (
        <div className={cn("mt-1 flex gap-1", ours ? "" : "justify-end")}>
          <button type="button" className="btn h-11 w-11 px-0" aria-label="Them minus a run" onClick={onMinus}>
            −
          </button>
          <button type="button" className="btn h-11 w-11 px-0" aria-label="Them plus a run" onClick={onPlus}>
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}

function BasesRow({
  bases,
  players,
  reached,
}: {
  bases: ReturnType<typeof liveScoring>["bases"];
  players: Player[];
  reached: number;
}) {
  const nameOf = (id: string | null) => {
    if (!id) return "—";
    return shortName(players.find((player) => player.id === id)?.name ?? "Runner");
  };
  return (
    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
      <Bag label="3rd" name={nameOf(bases.third)} hot={reached >= 3 && Boolean(bases.third)} />
      <Bag label="2nd" name={nameOf(bases.second)} hot={reached >= 2 && Boolean(bases.second)} />
      <Bag label="1st" name={nameOf(bases.first)} hot={reached >= 1 && Boolean(bases.first)} />
    </div>
  );
}

function Bag({ label, name, hot }: { label: string; name: string; hot: boolean }) {
  return (
    <div className={cn("rounded-sm px-2 py-1", hot && "bg-surface")}>
      <p className="text-xs font-semibold tracking-widest text-muted">{label}</p>
      <p className="truncate font-display text-lg leading-none">{name}</p>
    </div>
  );
}

function RunnerToggle({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-11 rounded-sm px-3 font-semibold",
        pressed ? "bg-accent text-accent-foreground" : "border border-border bg-card",
      )}
    >
      {label}
    </button>
  );
}

function ScoreGrid({
  order,
  players,
  scorecard,
  innings,
}: {
  order: string[];
  players: Player[];
  scorecard: Scorecard;
  innings: number;
}) {
  const cols = Math.max(innings, 1);
  return (
    <section className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-max min-w-full border-collapse text-center">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-display text-lg tracking-wide">
              Scorecard
            </th>
            {Array.from({ length: cols }, (_, i) => (
              <th key={i} className="w-14 px-1 py-2 font-display text-lg tabular-nums">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {order.map((id) => {
            const player = players.find((item) => item.id === id);
            if (!player) return null;
            return (
              <tr key={id} className="border-t border-border">
                <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium">
                  <span className="mr-1 font-display text-lg tabular-nums">{player.number || "–"}</span>
                  {shortName(player.name)}
                </th>
                {Array.from({ length: cols }, (_, i) => {
                  const marks = notationsFor(scorecard.plays, id, i);
                  return (
                    <td key={i} className="w-14 px-1 py-2 font-display text-sm leading-tight tabular-nums">
                      {marks.length ? marks.join(" ") : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          <tr className="border-t border-border">
            <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left text-sm text-muted">Runs</th>
            {lineScore(scorecard.plays, cols).map((row, i) => (
              <td key={i} className="px-1 py-2 font-display text-lg tabular-nums">
                {row.outs || row.hits || row.runs ? row.runs : ""}
              </td>
            ))}
          </tr>
          <tr className="border-t border-border">
            <th className="sticky left-0 z-10 bg-card px-2 py-2 text-left text-sm text-muted">Hits</th>
            {lineScore(scorecard.plays, cols).map((row, i) => (
              <td key={i} className="px-1 py-2 font-display text-lg tabular-nums">
                {row.outs || row.hits || row.runs ? row.hits : ""}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function BoxScoreView({
  teamName,
  players,
  order,
  scorecard,
  scheduledInnings,
  closed,
  onBack,
  onResume,
}: {
  teamName: string;
  players: Player[];
  order: string[];
  scorecard: Scorecard;
  scheduledInnings: number;
  closed: boolean;
  onBack: () => void;
  onResume: () => void;
}) {
  const lines = boxScore(scorecard.plays, order);
  const totals = teamBox(lines);
  const innings = lineScore(scorecard.plays, scheduledInnings);
  const us = gameTally(scorecard.plays);
  const them = opponentTotal(scorecard.opponentRuns);

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl tracking-wide">Box score</h2>
        <p className="font-display text-2xl tabular-nums">
          {us.runs}–{them}
        </p>
      </div>
      <p className="text-sm text-muted">{teamName}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-border text-xs tracking-widest text-muted">
              <th className="sticky left-0 bg-card px-2 py-2 text-left"> </th>
              {innings.map((_, i) => (
                <th key={i} className="w-8 px-1 py-2 tabular-nums">
                  {i + 1}
                </th>
              ))}
              <th className="w-8 px-1 py-2">R</th>
              <th className="w-8 px-1 py-2">H</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="sticky left-0 bg-card px-2 py-2 text-left font-medium">{teamName}</th>
              {innings.map((row, i) => (
                <td key={i} className="px-1 py-2 font-display text-lg tabular-nums">
                  {row.runs}
                </td>
              ))}
              <td className="px-1 py-2 font-display text-lg tabular-nums">{us.runs}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{us.hits}</td>
            </tr>
            <tr className="border-t border-border">
              <th className="sticky left-0 bg-card px-2 py-2 text-left font-medium">Them</th>
              {innings.map((_, i) => (
                <td key={i} className="px-1 py-2 font-display text-lg tabular-nums">
                  {scorecard.opponentRuns[i] ?? 0}
                </td>
              ))}
              <td className="px-1 py-2 font-display text-lg tabular-nums">{them}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">–</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-max min-w-full border-collapse text-center">
          <thead>
            <tr className="border-b border-border text-xs tracking-widest text-muted">
              <th className="sticky left-0 bg-card px-2 py-2 text-left">Batter</th>
              <th className="w-8 px-1 py-2">AB</th>
              <th className="w-8 px-1 py-2">R</th>
              <th className="w-8 px-1 py-2">H</th>
              <th className="w-10 px-1 py-2">RBI</th>
              <th className="w-8 px-1 py-2">BB</th>
              <th className="w-8 px-1 py-2">K</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const player = players.find((item) => item.id === line.playerId);
              if (!player) return null;
              return (
                <tr key={line.playerId} className="border-t border-border">
                  <th className="sticky left-0 bg-card px-2 py-2 text-left font-medium">
                    <span className="mr-1 font-display text-lg tabular-nums">{player.number || "–"}</span>
                    {player.name}
                  </th>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.ab}</td>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.r}</td>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.h}</td>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.rbi}</td>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.bb}</td>
                  <td className="px-1 py-2 font-display text-lg tabular-nums">{line.k}</td>
                </tr>
              );
            })}
            <tr className="border-t border-border">
              <th className="sticky left-0 bg-card px-2 py-2 text-left text-sm text-muted">Team</th>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.ab}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.r}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.h}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.rbi}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.bb}</td>
              <td className="px-1 py-2 font-display text-lg tabular-nums">{totals.k}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {scorecard.trackPitches && scorecard.pitches.length > 0 ? (
        <ul className="mt-3 text-sm">
          {scorecard.pitches.map((row) => {
            const player = players.find((item) => item.id === row.playerId);
            return (
              <li key={row.playerId}>
                {player ? player.name : "Pitcher"} · {row.count} pitches
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="mt-4 flex gap-2">
        {closed ? (
          <button type="button" className="btn flex-1" onClick={onResume}>
            Resume scoring
          </button>
        ) : (
          <button type="button" className="btn flex-1" onClick={onBack}>
            Back to the card
          </button>
        )}
      </div>
    </section>
  );
}

export function PitchSetting({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <p className="text-sm">Pitch count</p>
      <div className="flex h-11 overflow-hidden rounded-sm border border-border">
        <button
          type="button"
          aria-pressed={!on}
          onClick={() => onToggle(false)}
          className={cn(
            "w-14 font-display text-lg",
            !on ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
          )}
        >
          Off
        </button>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => onToggle(true)}
          className={cn(
            "w-14 border-l border-border font-display text-lg",
            on ? "bg-accent text-accent-foreground" : "bg-card text-foreground",
          )}
        >
          On
        </button>
      </div>
    </div>
  );
}
