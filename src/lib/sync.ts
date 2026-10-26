import { useEffect, useRef, useState } from "react";
import { loadGame, saveGame } from "@/lib/dugout.functions";
import { cloneScorecard } from "@/lib/scorecard";
import type { DugoutState } from "@/lib/snapshot";
import { useDugout } from "@/lib/store";

export type CloudStatus = "loading" | "saving" | "saved" | "error";

function pick(state: DugoutState): DugoutState {
  return {
    teamName: state.teamName,
    players: state.players,
    innings: state.innings,
    inningIndex: state.inningIndex,
    tenField: state.tenField,
    battingOrder: state.battingOrder,
    batterIndex: state.batterIndex,
    outIds: state.outIds,
    scorecard: cloneScorecard(state.scorecard),
  };
}

function sameState(a: DugoutState, b: DugoutState): boolean {
  return JSON.stringify(pick(a)) === JSON.stringify(pick(b));
}

export function useDugoutCloud(
  code: string | null,
  onMissing: () => void,
): {
  status: CloudStatus;
  retry: () => void;
} {
  const [status, setStatus] = useState<CloudStatus>(code ? "loading" : "saved");
  const ready = useRef(false);
  const timer = useRef(0);
  const revision = useRef(0);
  const localGen = useRef(0);
  const savedGen = useRef(0);
  const applying = useRef(false);
  const onMissingRef = useRef(onMissing);
  onMissingRef.current = onMissing;

  useEffect(() => {
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

    void (async () => {
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
      void pull().catch(() => {
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

  useEffect(() => {
    if (!code) return;
    const unsub = useDugout.subscribe((state, prev) => {
      if (!ready.current || applying.current || sameState(state, prev)) return;
      const gen = localGen.current;
      setStatus("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        void saveGame({ data: { code, state: pick(state) } })
          .then((result) => {
            revision.current = result.revision;
            if (localGen.current === gen) savedGen.current = gen;
            setStatus("saved");
          })
          .catch(() => setStatus("error"));
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
    void saveGame({ data: { code, state: pick(useDugout.getState()) } })
      .then((result) => {
        revision.current = result.revision;
        if (localGen.current === gen) savedGen.current = gen;
        setStatus("saved");
      })
      .catch(() => setStatus("error"));
  }

  return { status, retry };
}
