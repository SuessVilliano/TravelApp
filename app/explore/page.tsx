"use client";

import { Sparkles } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { BottomNav } from "@/components/BottomNav";

// Explore is a static, inspirational discovery feed for the MVP. Later this is
// where the AI recommendation engine + public itineraries surface.
const INSPO = [
  { title: "3-Day Miami Nightlife Guide", tag: "Nightlife", cover: "cover-tropic", meta: "from $1,150 / person" },
  { title: "Tulum Hidden Gems", tag: "Hidden gems", cover: "cover-sand", meta: "12 saved spots" },
  { title: "Tokyo Foodie Crawl", tag: "Foodie", cover: "cover-night", meta: "from $1,800 / person" },
  { title: "Santorini Sunset Week", tag: "Luxury", cover: "cover-sunset", meta: "from $2,400 / person" },
  { title: "Costa Rica Outdoor Adventure", tag: "Outdoors", cover: "cover-ocean", meta: "9 activities" },
];

const INTERESTS = [
  "Nightlife", "Foodie", "Beaches", "Hidden gems", "Luxury",
  "Outdoors", "Family", "Museums", "Shopping",
];

export default function ExplorePage() {
  return (
    <AuthGate>
      <Explore />
    </AuthGate>
  );
}

function Explore() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="px-5 pb-2 pt-6">
        <h1 className="text-2xl font-extrabold">Explore</h1>
        <p className="text-sm text-muted">
          Inspiration for your next trip
        </p>
      </header>

      <div className="no-scrollbar -mx-0 mb-3 flex gap-2 overflow-x-auto px-5">
        {INTERESTS.map((i) => (
          <span
            key={i}
            className="whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink/70"
          >
            {i}
          </span>
        ))}
      </div>

      <main className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-5 pb-6">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-muted">
          <Sparkles size={16} className="text-sunset-500" /> Trending guides
        </div>
        {INSPO.map((g) => (
          <div
            key={g.title}
            className={`${g.cover} relative flex h-40 flex-col justify-end overflow-hidden rounded-3xl p-4 text-white shadow-lg`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="relative">
              <span className="mb-1 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
                {g.tag}
              </span>
              <h3 className="text-lg font-bold leading-tight">{g.title}</h3>
              <p className="text-sm text-white/85">{g.meta}</p>
            </div>
          </div>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
