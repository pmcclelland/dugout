import { FieldArt } from "@/components/field-art";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function DugoutSkeleton() {
  return (
    <div className="flex h-dvh flex-col px-4" aria-busy="true" aria-label="Loading Dugout">
      <div className="header-safe">
        <div className="h-4 w-24 animate-pulse rounded-sm bg-surface" />
        <div className="mt-3 h-10 w-48 animate-pulse rounded-sm bg-surface" />
        <div className="mt-4 h-11 w-full animate-pulse rounded-sm bg-surface" />
      </div>
      <div className="field-slot">
        <div className="diamond">
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <FieldArt />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignInScreen() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="relative mb-6 h-44 overflow-hidden rounded-xl">
          <FieldArt />
        </div>
        <p className="font-display text-sm tracking-widest text-muted">DUGOUT</p>
        <h1 className="font-display text-5xl leading-none">Your lineup, saved</h1>
        <p className="mt-3 text-pretty text-muted">
          Sign in with Google to keep this team’s name, roster, defensive innings, and batting order on your account.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((provider) => (
              <button
                key={provider.providerId}
                type="button"
                onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
                className={cn("btn h-12 w-full", provider.providerId === "grok-google" && "btn-primary")}
              >
                Continue with {provider.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is turned off.</p>
          )}
        </div>
      </div>
    </main>
  );
}
