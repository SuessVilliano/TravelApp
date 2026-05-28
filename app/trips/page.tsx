"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { TripCard } from "@/components/TripCard";
import { db } from "@/lib/db";
import type { Trip } from "@/lib/types";

export default function TripsPage() {
  return (
    <AuthGate>
      <Trips />
    </AuthGate>
  );
}

function Trips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const store = await db();
      const ts = await store.listTrips();
      setTrips(ts);
      const c: Record<string, number> = {};
      for (const t of ts) {
        const members = await store.listMembers(t.id);
        c[t.id] = members.filter((m) => m.status === "accepted").length;
      }
      setCounts(c);
    })();
  }, []);

  const now = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => t.endDate >= now);
  const past = trips.filter((t) => t.endDate < now);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-5 pb-3 pt-6">
        <h1 className="text-2xl font-extrabold">Trips</h1>
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-1 rounded-full bg-ocean-500 px-4 py-2 text-sm font-semibold text-white active:scale-95"
        >
          <Plus size={16} /> New
        </Link>
      </header>

      <main className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 pb-6">
        {upcoming.map((t) => (
          <TripCard key={t.id} trip={t} memberCount={counts[t.id] ?? 1} />
        ))}

        {past.length > 0 && (
          <>
            <h2 className="pt-2 text-sm font-semibold text-muted">
              Past trips
            </h2>
            {past.map((t) => (
              <TripCard key={t.id} trip={t} memberCount={counts[t.id] ?? 1} />
            ))}
          </>
        )}

        {trips.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-20 text-center text-muted">
            <p>No trips yet.</p>
            <Link
              href="/trips/new"
              className="rounded-full bg-ocean-500 px-5 py-2.5 font-semibold text-white"
            >
              Plan your first trip
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
