"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, MapPin } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { coverClass } from "@/lib/covers";
import { db } from "@/lib/db";
import type { Trip, User } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AuthGate>
      <Profile />
    </AuthGate>
  );
}

const TRAVEL_TAGS = ["🍣 Foodie", "🏝 Beaches", "🌃 Nightlife"];

function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    (async () => {
      const store = await db();
      const [u, ts] = await Promise.all([
        store.getCurrentUser(),
        store.listTrips(),
      ]);
      setUser(u);
      setTrips(ts);
    })();
  }, []);

  async function signOut() {
    const store = await db();
    await store.signOut();
    router.replace("/login");
  }

  if (!user) return null;

  const destinations = new Set(trips.map((t) => t.destination));

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="no-scrollbar flex-1 overflow-y-auto pb-6">
        <div className="cover-tropic h-28" />
        <div className="-mt-12 px-5">
          <div className="flex items-end justify-between">
            <div className="rounded-full ring-4 ring-white">
              <Avatar name={user.name} size={84} />
            </div>
            <div className="mb-1 flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted"
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold">{user.name}</h1>
          <p className="text-sm text-muted">{user.email}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {TRAVEL_TAGS.map((t) => (
              <span
                key={t}
                className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-medium text-ocean-700"
              >
                {t}
              </span>
            ))}
          </div>

          {/* travel stats */}
          <div className="mt-5 grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface py-3 text-center shadow-sm">
            <Stat value={trips.length} label="Trips" />
            <Stat value={destinations.size} label="Destinations" />
            <Stat value={TRAVEL_TAGS.length} label="Vibes" />
          </div>

          {/* trips grid */}
          <h2 className="mb-2 mt-6 text-sm font-bold text-muted">Trips</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {trips.map((t) => (
              <div
                key={t.id}
                className={`${coverClass(
                  t.coverColor,
                )} relative flex h-28 flex-col justify-end overflow-hidden rounded-2xl p-3 text-white`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                <div className="relative">
                  <p className="text-sm font-bold leading-tight">{t.name}</p>
                  <p className="inline-flex items-center gap-0.5 text-[11px] text-white/85">
                    <MapPin size={11} /> {t.destination}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
