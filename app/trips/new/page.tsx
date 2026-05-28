"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { COVERS, coverClass } from "@/lib/covers";
import { db } from "@/lib/db";

export default function NewTripPage() {
  return (
    <AuthGate>
      <NewTrip />
    </AuthGate>
  );
}

function NewTrip() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverColor, setCoverColor] = useState<string>(COVERS[0].key);
  const [busy, setBusy] = useState(false);

  const valid = name && destination && startDate && endDate && endDate >= startDate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    const store = await db();
    const trip = await store.createTrip({
      name,
      destination,
      startDate,
      endDate,
      coverColor,
    });
    router.replace(`/trips/${trip.id}`);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center gap-3 px-5 pb-2 pt-6">
        <Link href="/trips" className="text-muted">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-xl font-bold">New trip</h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 pb-6 pt-2"
      >
        <div
          className={`${coverClass(
            coverColor,
          )} flex h-32 items-end rounded-3xl p-4 text-white shadow-lg`}
        >
          <span className="text-lg font-bold">
            {name || "Your trip name"}
          </span>
        </div>

        <Field label="Trip name">
          <input
            className="input"
            placeholder="Miami Crew 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Destination">
          <input
            className="input"
            placeholder="Miami, FL"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="End">
            <input
              type="date"
              className="input"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Cover">
          <div className="flex gap-2">
            {COVERS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCoverColor(c.key)}
                className={`${c.className} h-11 flex-1 rounded-xl ${
                  coverColor === c.key
                    ? "ring-2 ring-ocean-500 ring-offset-2 ring-offset-surface"
                    : ""
                }`}
                aria-label={c.label}
              />
            ))}
          </div>
        </Field>

        <button
          type="submit"
          disabled={!valid || busy}
          className="w-full rounded-xl bg-ocean-500 py-3.5 font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create trip"}
        </button>
      </form>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(var(--line));
          background: rgb(var(--surface));
          color: rgb(var(--ink));
          padding: 0.75rem 1rem;
          outline: none;
        }
        .input:focus {
          border-color: #2cbeff;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink/70">
        {label}
      </span>
      {children}
    </label>
  );
}
