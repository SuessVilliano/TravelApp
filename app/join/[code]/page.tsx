"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { coverClass } from "@/lib/covers";
import { dateRange } from "@/lib/format";
import { AuthGate } from "@/components/AuthGate";
import { db } from "@/lib/db";
import type { Trip } from "@/lib/types";

export default function JoinPage() {
  return (
    <AuthGate>
      <Join />
    </AuthGate>
  );
}

function Join() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const store = await db();
      const t = await store.getTripByInviteCode(code);
      if (!t) setNotFound(true);
      else setTrip(t);
    })();
  }, [code]);

  async function respond(status: "accepted" | "maybe" | "declined") {
    if (!trip) return;
    const store = await db();
    await store.joinTrip(trip.id, status);
    router.replace(`/trips/${trip.id}`);
  }

  if (notFound) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 p-8 text-center text-muted">
        <p className="text-lg font-semibold">Invite not found</p>
        <p className="text-sm">That invite code doesn’t match any trip.</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center p-6">
      <p className="mb-3 text-center text-sm text-muted">
        You’re invited to
      </p>
      <div
        className={`${coverClass(
          trip.coverColor,
        )} mb-6 rounded-3xl p-6 text-center text-white shadow-lg`}
      >
        <h1 className="text-2xl font-extrabold">{trip.name}</h1>
        <p className="mt-1 text-white/90">{trip.destination}</p>
        <p className="text-sm text-white/80">
          {dateRange(trip.startDate, trip.endDate)}
        </p>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => respond("accepted")}
          className="w-full rounded-xl bg-ocean-500 py-3.5 font-semibold text-white active:scale-[0.98]"
        >
          Accept & join
        </button>
        <button
          onClick={() => respond("maybe")}
          className="w-full rounded-xl bg-amber-100 py-3.5 font-semibold text-amber-700 active:scale-[0.98]"
        >
          Maybe
        </button>
        <button
          onClick={() => respond("declined")}
          className="w-full rounded-xl bg-surface-2 py-3.5 font-semibold text-muted active:scale-[0.98]"
        >
          Can’t make it
        </button>
      </div>
    </div>
  );
}
