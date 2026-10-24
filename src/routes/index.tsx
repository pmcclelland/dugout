import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DugoutApp } from "@/components/dugout-app";
import { GameCodeScreen } from "@/components/game-code-screen";
import { DugoutSkeleton } from "@/components/sign-in-screen";
import { normalizeCode } from "@/lib/game-code";

const CODE_KEY = "dugout-game-code";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const stored = normalizeCode(localStorage.getItem(CODE_KEY) ?? "");
    setCode(stored);
    setReady(true);
  }, []);

  function open(next: string) {
    localStorage.setItem(CODE_KEY, next);
    setNotice(null);
    setCode(next);
  }

  function leave(message?: string) {
    localStorage.removeItem(CODE_KEY);
    setNotice(message ?? null);
    setCode(null);
  }

  if (!ready) return <DugoutSkeleton />;
  if (!code) return <GameCodeScreen notice={notice} onOpen={open} />;
  return (
    <DugoutApp
      code={code}
      onLeave={() => leave()}
      onMissing={() => leave("That game code is no longer available.")}
    />
  );
}
