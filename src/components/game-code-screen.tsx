import { useState } from "react";
import { FieldArt } from "@/components/field-art";
import { createGame, loadGame } from "@/lib/dugout.functions";
import { formatCode, normalizeCode } from "@/lib/game-code";

export function GameCodeScreen({
  notice,
  onOpen,
}: {
  notice: string | null;
  onOpen: (code: string) => void;
}) {
  const [entry, setEntry] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"start" | "join" | null>(null);
  const name = teamName.trim().slice(0, 40);

  async function start() {
    if (!name) return;
    setBusy("start");
    setError(null);
    try {
      const created = await createGame({
        data: { teamName: name },
      });
      onOpen(created.code);
    } catch {
      setError("Could not start a game. Try again.");
      setBusy(null);
    }
  }

  async function join(event: React.FormEvent) {
    event.preventDefault();
    const code = normalizeCode(entry);
    if (!code) {
      setError("Enter the 6-character code, like K7M-4QP.");
      return;
    }
    setBusy("join");
    setError(null);
    try {
      const remote = await loadGame({ data: { code } });
      if (!remote) {
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

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="relative mb-6 h-44 overflow-hidden rounded-xl">
          <FieldArt />
        </div>
        <p className="font-display text-sm tracking-widest text-muted">DUGOUT</p>
        <h1 className="font-display text-5xl leading-none">Name the team</h1>
        <p className="mt-3 text-pretty text-muted">
          Then start a game and share the code. Any coach who joins sees the same lineup.
        </p>
        {notice ? <p className="mt-3 text-sm text-warn">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-warn">{error}</p> : null}
        <label className="mt-6 block">
          <span className="font-display text-sm tracking-widest text-muted">TEAM NAME</span>
          <input
            aria-label="Team name"
            value={teamName}
            maxLength={40}
            placeholder="Mudcats"
            onChange={(event) => setTeamName(event.target.value)}
            className="input mt-1 w-full font-display text-3xl"
          />
        </label>
        <button
          type="button"
          className="btn btn-primary mt-3 h-12 w-full"
          disabled={busy !== null || !name}
          onClick={() => void start()}
        >
          {busy === "start" ? "Starting…" : "Start a game"}
        </button>
        <form className="mt-3 flex gap-2" onSubmit={(event) => void join(event)}>
          <input
            aria-label="Game code"
            value={entry}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="K7M-4QP"
            maxLength={8}
            onChange={(event) => setEntry(event.target.value.toUpperCase())}
            className="input min-w-0 flex-1 font-display text-2xl tracking-wide uppercase"
          />
          <button
            type="submit"
            className="btn h-12 shrink-0 px-4"
            disabled={busy !== null || !known}
          >
            {busy === "join" ? "…" : "Join"}
          </button>
        </form>
        {known ? (
          <p className="mt-2 text-sm text-muted">Joining {formatCode(known)}</p>
        ) : (
          <p className="mt-2 text-sm text-muted">Or join a game another coach already started.</p>
        )}
      </div>
    </main>
  );
}
