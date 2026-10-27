import { useState } from "react";
import { FieldArt } from "@/components/field-art";
import { createGame, loadGame } from "@/lib/dugout.functions";
import {
  CODE_TAKEN_MESSAGE,
  formatCode,
  isCodeTakenError,
  normalizeCode,
} from "@/lib/game-code";

export function GameCodeScreen({
  notice,
  onOpen,
}: {
  notice: string | null;
  onOpen: (code: string) => void;
}) {
  const [entry, setEntry] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"start" | "join" | null>(null);
  const name = teamName.trim().slice(0, 40);
  const chosen = normalizeCode(teamCode);

  async function start(event: React.FormEvent) {
    event.preventDefault();
    if (!name || !chosen) return;
    setBusy("start");
    setError(null);
    setCodeError(null);
    try {
      const created = await createGame({
        data: { teamName: name, code: chosen },
      });
      onOpen(created.code);
    } catch (cause) {
      if (isCodeTakenError(cause)) setCodeError(CODE_TAKEN_MESSAGE);
      else setError("Could not start a game. Try again.");
      setBusy(null);
    }
  }

  async function join(event: React.FormEvent) {
    event.preventDefault();
    const code = normalizeCode(entry);
    if (!code) {
      setError("Enter a team code.");
      return;
    }
    setBusy("join");
    setError(null);
    setCodeError(null);
    try {
      const remote = await loadGame({ data: { code } });
      if (!remote) {
        setError("No team with that code.");
        setBusy(null);
        return;
      }
      onOpen(remote.code);
    } catch {
      setError("Could not open that team. Try again.");
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
          Pick a code you can remember, then start. Any coach who joins with it sees the same
          lineup.
        </p>
        {notice ? <p className="mt-3 text-sm text-warn">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-warn">{error}</p> : null}
        <form onSubmit={(event) => void start(event)}>
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
          <label className="mt-4 block">
            <span className="font-display text-sm tracking-widest text-muted">TEAM CODE</span>
            <input
              aria-label="Team code"
              aria-invalid={Boolean(codeError)}
              aria-describedby={codeError ? "team-code-error" : undefined}
              value={teamCode}
              maxLength={40}
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Tigers"
              onChange={(event) => {
                setTeamCode(event.target.value);
                if (codeError) setCodeError(null);
              }}
              className="input mt-1 w-full font-display text-3xl"
            />
          </label>
          {codeError ? (
            <p id="team-code-error" className="mt-2 text-sm text-warn">
              {codeError}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">Codes are matched without worrying about caps.</p>
          )}
          <button
            type="submit"
            className="btn btn-primary mt-3 h-12 w-full"
            disabled={busy !== null || !name || !chosen}
          >
            {busy === "start" ? "Starting…" : "Start a game"}
          </button>
        </form>
        <form className="mt-3 flex gap-2" onSubmit={(event) => void join(event)}>
          <input
            aria-label="Join team code"
            value={entry}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Tigers"
            maxLength={40}
            onChange={(event) => setEntry(event.target.value)}
            className="input min-w-0 flex-1 font-display text-2xl tracking-wide"
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
          <p className="mt-2 text-sm text-muted">Or join with a code another coach already picked.</p>
        )}
      </div>
    </main>
  );
}
