"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plane } from "lucide-react";
import { db, usingLocalMode } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const store = await db();
    await store.signIn(name.trim() || "Traveler", email.trim());
    if (usingLocalMode) {
      router.replace("/");
    } else {
      setSent(true); // magic-link sent
      setBusy(false);
    }
  }

  return (
    <div className="cover-tropic flex min-h-[100dvh] flex-col justify-between p-7 text-white">
      <div className="pt-16">
        <div className="mb-4 flex items-center gap-2">
          <Plane size={28} />
          <span className="text-xl font-bold tracking-tight">VoyageCircle</span>
        </div>
        <h1 className="text-4xl font-extrabold leading-tight">
          Plan trips together.
          <br />
          Split the cost. Keep the memories.
        </h1>
        <p className="mt-3 max-w-xs text-white/85">
          The social way to plan group vacations — itineraries, budgets and
          albums, all in one place.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-surface p-5 text-ink shadow-2xl"
      >
        {sent ? (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold">Check your email ✉️</p>
            <p className="mt-1 text-sm text-muted">
              We sent a magic sign-in link to {email}.
            </p>
          </div>
        ) : (
          <>
            <h2 className="mb-3 text-lg font-bold">Get started</h2>
            <input
              className="mb-3 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ocean-400"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="mb-4 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ocean-400"
              placeholder="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-ocean-500 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "…" : usingLocalMode ? "Enter app" : "Send magic link"}
            </button>
            {usingLocalMode && (
              <p className="mt-3 text-center text-xs text-muted">
                Demo mode — no signup needed. Data saves to this browser.
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
