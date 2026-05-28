"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plane, Plus, Sparkles } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";
import { TripCard } from "@/components/TripCard";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Splash } from "@/components/Loader";
import { db, usingLocalMode } from "@/lib/db";
import type { ItineraryItem, Trip, TripMember, User } from "@/lib/types";
import { money } from "@/lib/format";

interface FeedPost {
  id: string;
  who: string;
  text: string;
  tripName: string;
  amount?: number;
}

export default function HomePage() {
  return (
    <AuthGate>
      <Home />
    </AuthGate>
  );
}

function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const store = await db();
      const [u, ts] = await Promise.all([
        store.getCurrentUser(),
        store.listTrips(),
      ]);
      setUser(u);
      setTrips(ts);

      const counts: Record<string, number> = {};
      const posts: FeedPost[] = [];
      for (const t of ts) {
        const [members, items] = await Promise.all([
          store.listMembers(t.id),
          store.listItems(t.id),
        ]);
        counts[t.id] = members.filter((m) => m.status === "accepted").length;
        posts.push(...buildFeed(t, members, items));
      }
      setMemberCounts(counts);
      setFeed(posts.slice(0, 8));
      setLoading(false);
    })();
  }, []);

  if (loading) return <Splash />;

  return (
    <div className="flex min-h-[100dvh] flex-col animate-fade-in">
      <header className="flex items-center justify-between px-5 pb-2 pt-6">
        <div className="flex items-center gap-2">
          <Plane className="text-ocean-500" size={24} />
          <span className="text-lg font-extrabold tracking-tight">
            VoyageCircle
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && <Avatar name={user.name} size={36} />}
        </div>
      </header>

      {usingLocalMode && (
        <p className="mx-5 mb-2 rounded-xl bg-sunset-500/10 px-3 py-2 text-[12px] text-sunset-600">
          Demo mode — data is saved to this browser. Add Supabase keys to go
          live.
        </p>
      )}

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6">
        <h1 className="mb-3 mt-2 text-2xl font-bold">
          Hey {user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>

        {/* Upcoming trips carousel */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">
              Your trips
            </h2>
            <Link href="/trips" className="text-sm font-medium text-ocean-600">
              See all
            </Link>
          </div>
          <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5">
            {trips.map((t) => (
              <div key={t.id} className="w-[280px] shrink-0 snap-start">
                <TripCard trip={t} memberCount={memberCounts[t.id] ?? 1} />
              </div>
            ))}
            <Link
              href="/trips/new"
              className="flex w-[140px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line text-muted"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">New trip</span>
            </Link>
          </div>
        </div>

        {/* Activity feed */}
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles size={16} className="text-sunset-500" />
          <h2 className="text-sm font-semibold text-muted">
            Activity
          </h2>
        </div>
        <div className="space-y-2.5">
          {feed.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3 shadow-sm"
            >
              <Avatar name={p.who} size={36} />
              <div className="flex-1 text-sm">
                <p>
                  <span className="font-semibold">{p.who}</span> {p.text}
                </p>
                <p className="text-xs text-muted">{p.tripName}</p>
              </div>
              {p.amount != null && (
                <span className="whitespace-nowrap rounded-full bg-ocean-50 px-2 py-1 text-xs font-semibold text-ocean-700">
                  {money(p.amount)}
                </span>
              )}
            </div>
          ))}
          {feed.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No activity yet — create a trip to get started.
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function buildFeed(
  trip: Trip,
  members: TripMember[],
  items: ItineraryItem[],
): FeedPost[] {
  const nameOf = (id: string) =>
    members.find((m) => m.userId === id)?.name ?? "Someone";
  const posts: FeedPost[] = items
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
    .map((i) => ({
      id: i.id,
      who: nameOf(i.createdBy),
      text: `added ${i.title}`,
      tripName: trip.name,
      amount: i.estimatedCost,
    }));

  const confirmed = members.filter((m) => m.status === "accepted").length;
  if (confirmed > 1) {
    posts.push({
      id: `${trip.id}-conf`,
      who: `${confirmed} friends`,
      text: "confirmed for the trip",
      tripName: trip.name,
    });
  }
  return posts;
}
