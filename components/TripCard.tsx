import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { coverClass } from "@/lib/covers";
import { dateRange, tripDays } from "@/lib/format";
import type { Trip } from "@/lib/types";

export function TripCard({
  trip,
  memberCount,
}: {
  trip: Trip;
  memberCount: number;
}) {
  return (
    <Link href={`/trips/${trip.id}`} className="block">
      <div
        className={`${coverClass(
          trip.coverColor,
        )} relative flex h-44 flex-col justify-end overflow-hidden rounded-3xl p-4 text-white shadow-lg transition active:scale-[0.99]`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="relative">
          <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            {tripDays(trip.startDate, trip.endDate)} days ·{" "}
            {dateRange(trip.startDate, trip.endDate)}
          </div>
          <h3 className="text-xl font-bold leading-tight">{trip.name}</h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-white/90">
            <span className="inline-flex items-center gap-1">
              <MapPin size={14} /> {trip.destination}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={14} /> {memberCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
