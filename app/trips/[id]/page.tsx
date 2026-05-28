"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AISuggestSheet } from "@/components/AISuggestSheet";
import { AuthGate } from "@/components/AuthGate";
import { AddItemSheet } from "@/components/AddItemSheet";
import { Avatar } from "@/components/Avatar";
import { VoteBar } from "@/components/VoteBar";
import { Splash } from "@/components/Loader";
import { ConciergeSheet } from "@/components/ConciergeSheet";
import { db } from "@/lib/db";
import type { AddItemInput } from "@/lib/db";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/estimate";
import { coverClass } from "@/lib/covers";
import { dateRange, money, tripDays } from "@/lib/format";
import { computeTotals } from "@/lib/trip";
import type {
  ItineraryItem,
  Trip,
  TripMember,
  User,
} from "@/lib/types";

type Tab = "itinerary" | "budget" | "people";

export default function TripPage() {
  return (
    <AuthGate>
      <TripDetail />
    </AuthGate>
  );
}

function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [tab, setTab] = useState<Tab>("itinerary");
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);

  const refresh = useCallback(async () => {
    const store = await db();
    const [u, t, m, i] = await Promise.all([
      store.getCurrentUser(),
      store.getTrip(id),
      store.listMembers(id),
      store.listItems(id),
    ]);
    setUser(u);
    setTrip(t);
    setMembers(m);
    setItems(i);
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!trip || !user) {
    return <Splash label="Loading trip…" />;
  }

  const accepted = members.filter((m) => m.status === "accepted");
  const dayCount = tripDays(trip.startDate, trip.endDate);

  async function addItemRaw(input: AddItemInput) {
    const store = await db();
    await store.addItem(trip!.id, input);
    await refresh();
  }

  async function handleAdd(input: AddItemInput) {
    await addItemRaw(input);
    setShowAdd(false);
  }

  async function handleVote(itemId: string, value: "yes" | "no" | "must") {
    const store = await db();
    await store.voteItem(itemId, value);
    refresh();
  }

  async function handleDelete(itemId: string) {
    const store = await db();
    await store.deleteItem(itemId);
    refresh();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {/* cover header */}
      <div
        className={`${coverClass(
          trip.coverColor,
        )} relative px-5 pb-5 pt-6 text-white`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => router.push("/trips")}
              className="inline-flex items-center gap-1 text-sm text-white/90"
            >
              <ArrowLeft size={18} /> Trips
            </button>
            <button
              onClick={() => setShowConcierge(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold backdrop-blur active:scale-95"
            >
              <Sparkles size={15} /> Concierge
            </button>
          </div>
          <h1 className="text-2xl font-extrabold">{trip.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {trip.destination}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} />{" "}
              {dateRange(trip.startDate, trip.endDate)}
            </span>
          </div>
          <div className="mt-3 flex -space-x-2">
            {accepted.map((m) => (
              <Avatar key={m.userId} name={m.name} size={32} />
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="sticky top-0 z-20 flex border-b border-line bg-surface">
        {(["itinerary", "budget", "people"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition ${
              tab === t
                ? "border-b-2 border-ocean-500 text-ocean-600"
                : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 pb-24">
        {tab === "itinerary" && (
          <ItineraryTab
            items={items}
            dayCount={dayCount}
            userId={user.id}
            onVote={handleVote}
            onDelete={handleDelete}
          />
        )}
        {tab === "budget" && (
          <BudgetTab items={items} headcount={accepted.length} />
        )}
        {tab === "people" && (
          <PeopleTab trip={trip} members={members} />
        )}
      </main>

      {tab === "itinerary" && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
          <button
            onClick={() => setShowSuggest(true)}
            className="inline-flex items-center gap-2 rounded-full bg-sunset-500 px-5 py-3.5 font-semibold text-white shadow-xl active:scale-95"
          >
            <Sparkles size={18} /> AI plan
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-full bg-ocean-500 px-5 py-3.5 font-semibold text-white shadow-xl active:scale-95"
          >
            <Plus size={20} /> Add
          </button>
        </div>
      )}

      {showAdd && (
        <AddItemSheet
          tripDayCount={dayCount}
          defaultParty={Math.max(1, accepted.length)}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}

      {showSuggest && (
        <AISuggestSheet
          destination={trip.destination}
          days={dayCount}
          partySize={Math.max(1, accepted.length)}
          onClose={() => setShowSuggest(false)}
          onAdd={addItemRaw}
        />
      )}

      {showConcierge && (
        <ConciergeSheet
          context={{
            destination: trip.destination,
            days: dayCount,
            partySize: accepted.length,
            itinerary: items.map((i) => `Day ${i.day} ${i.title}`),
          }}
          onClose={() => setShowConcierge(false)}
        />
      )}
    </div>
  );
}

function ItineraryTab({
  items,
  dayCount,
  userId,
  onVote,
  onDelete,
}: {
  items: ItineraryItem[];
  dayCount: number;
  userId: string;
  onVote: (id: string, v: "yes" | "no" | "must") => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        Nothing planned yet. Tap “Add item” to start building the itinerary.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => {
        const dayItems = items.filter((it) => it.day === day);
        if (dayItems.length === 0) return null;
        return (
          <div key={day}>
            <h3 className="mb-2 text-sm font-bold text-muted">Day {day}</h3>
            <div className="space-y-2.5">
              {dayItems.map((it) => (
                <div
                  key={it.id}
                  className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        {it.time && (
                          <span className="text-xs font-semibold text-ocean-600">
                            {it.time}
                          </span>
                        )}
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                          {it.type}
                        </span>
                      </div>
                      <p className="mt-0.5 font-semibold leading-tight">
                        {it.title}
                      </p>
                      {it.location && (
                        <p className="text-xs text-muted">{it.location}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-ink">
                        {money(it.estimatedCost)}
                      </p>
                      <button
                        onClick={() => onDelete(it.id)}
                        className="mt-1 text-muted/50 hover:text-sunset-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <VoteBar
                      votes={it.votes}
                      myUserId={userId}
                      onVote={(v) => onVote(it.id, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BudgetTab({
  items,
  headcount,
}: {
  items: ItineraryItem[];
  headcount: number;
}) {
  const totals = computeTotals(items, headcount);
  return (
    <div>
      <div className="cover-ocean mb-5 rounded-3xl p-5 text-white shadow-lg">
        <p className="text-sm text-white/80">Estimated trip total</p>
        <p className="text-4xl font-extrabold">{money(totals.total)}</p>
        <p className="mt-1 text-sm text-white/90">
          {money(totals.perPerson)} / person · {headcount} going
        </p>
      </div>

      <h3 className="mb-3 text-sm font-bold text-muted">By category</h3>
      <div className="space-y-3">
        {totals.byCategory.map((c) => {
          const pct = totals.total ? (c.amount / totals.total) * 100 : 0;
          return (
            <div key={c.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium">
                  {CATEGORY_LABELS[c.category]}
                </span>
                <span className="text-muted">{money(c.amount)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: CATEGORY_COLORS[c.category],
                  }}
                />
              </div>
            </div>
          );
        })}
        {totals.byCategory.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            Add itinerary items to see the budget breakdown.
          </p>
        )}
      </div>

      <p className="mt-6 rounded-xl bg-surface-2 p-3 text-xs text-muted">
        These are heuristic estimates, not quotes. Real prices from Yelp /
        Google Places / Viator can be wired in later.
      </p>
    </div>
  );
}

function PeopleTab({
  trip,
  members,
}: {
  trip: Trip;
  members: TripMember[];
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const inviteUrl = `${origin}/join/${trip.inviteCode}`;
  const [copied, setCopied] = useState(false);

  const STATUS_STYLE: Record<string, string> = {
    accepted: "bg-green-100 text-green-700",
    pending: "bg-surface-2 text-muted",
    maybe: "bg-amber-100 text-amber-700",
    declined: "bg-red-100 text-red-600",
  };

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-ocean-100 bg-ocean-50 p-4">
        <p className="text-sm font-semibold text-ocean-700">Invite friends</p>
        <p className="mb-3 text-xs text-ocean-700/70">
          Share this link — anyone with it can join the planning room.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 text-xs text-ink/70">
            {inviteUrl}
          </code>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(inviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg bg-ocean-500 px-3 py-2 text-xs font-semibold text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-ocean-700/60">
          Code: <span className="font-bold">{trip.inviteCode}</span>
        </p>
      </div>

      <h3 className="mb-3 text-sm font-bold text-muted">
        Members ({members.length})
      </h3>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
          >
            <Avatar name={m.name} size={38} />
            <div className="flex-1">
              <p className="font-semibold leading-tight">{m.name}</p>
              {m.role === "host" && (
                <p className="text-xs text-muted">Host</p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                STATUS_STYLE[m.status]
              }`}
            >
              {m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
