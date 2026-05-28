"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { estimate } from "@/lib/estimate";
import { money } from "@/lib/format";
import type {
  AddItemInput,
} from "@/lib/db";
import type {
  ExpenseCategory,
  ItineraryEstimateInput,
  ItineraryType,
} from "@/lib/types";

const TYPE_TO_CATEGORY: Record<ItineraryType, ExpenseCategory> = {
  restaurant: "food",
  activity: "activities",
  lodging: "lodging",
  transport: "transportation",
  other: "misc",
};

const TYPE_TO_KIND: Record<ItineraryType, ItineraryEstimateInput["kind"]> = {
  restaurant: "restaurant",
  activity: "activity",
  lodging: "lodging",
  transport: "transport",
  other: "flat",
};

export function AddItemSheet({
  tripDayCount,
  defaultParty,
  onClose,
  onAdd,
}: {
  tripDayCount: number;
  defaultParty: number;
  onClose: () => void;
  onAdd: (input: AddItemInput) => void;
}) {
  const [type, setType] = useState<ItineraryType>("restaurant");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [day, setDay] = useState(1);
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(defaultParty);

  // restaurant inputs
  const [priceTier, setPriceTier] = useState<1 | 2 | 3 | 4>(2);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner">(
    "dinner",
  );
  const [includesDrinks, setIncludesDrinks] = useState(true);
  // activity/transport/flat
  const [perPerson, setPerPerson] = useState<number>(0);
  const [flat, setFlat] = useState<number>(0);
  // lodging
  const [nights, setNights] = useState<number>(Math.max(1, tripDayCount - 1));

  const estimateInput: ItineraryEstimateInput = useMemo(() => {
    const kind = TYPE_TO_KIND[type];
    if (kind === "restaurant") {
      return { kind, partySize, priceTier, mealType, includesDrinks };
    }
    if (kind === "lodging") {
      return { kind, partySize, flat, nights };
    }
    return { kind, partySize, perPerson, flat };
  }, [
    type,
    partySize,
    priceTier,
    mealType,
    includesDrinks,
    perPerson,
    flat,
    nights,
  ]);

  const breakdown = useMemo(() => estimate(estimateInput), [estimateInput]);

  function submit() {
    if (!title.trim()) return;
    onAdd({
      type,
      title: title.trim(),
      location: location.trim() || undefined,
      day,
      time,
      category: TYPE_TO_CATEGORY[type],
      estimate: estimateInput,
    });
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="no-scrollbar max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Add to itinerary</h2>
          <button onClick={onClose} className="text-muted">
            <X size={22} />
          </button>
        </div>

        {/* type chips */}
        <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
          {(
            ["restaurant", "activity", "lodging", "transport", "other"] as const
          ).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
                type === t
                  ? "bg-ocean-500 text-white"
                  : "bg-surface-2 text-ink/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <input
          className="mb-3 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ocean-400"
          placeholder="Title (e.g. Rooftop sushi dinner)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="mb-3 w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ocean-400"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="mb-3 grid grid-cols-3 gap-3">
          <Labeled label="Day">
            <select
              className="select"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              {Array.from({ length: tripDayCount }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          </Labeled>
          <Labeled label="Time">
            <input
              type="time"
              className="select"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Labeled>
          <Labeled label="Party">
            <input
              type="number"
              min={1}
              className="select"
              value={partySize}
              onChange={(e) =>
                setPartySize(Math.max(1, Number(e.target.value)))
              }
            />
          </Labeled>
        </div>

        {/* estimator inputs */}
        {type === "restaurant" && (
          <div className="mb-3 space-y-3 rounded-2xl bg-surface-2 p-3">
            <Labeled label="Price level">
              <div className="flex gap-2">
                {([1, 2, 3, 4] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPriceTier(t)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                      priceTier === t
                        ? "bg-ocean-500 text-white"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {"$".repeat(t)}
                  </button>
                ))}
              </div>
            </Labeled>
            <Labeled label="Meal">
              <div className="flex gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize ${
                      mealType === m
                        ? "bg-ocean-500 text-white"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </Labeled>
            <label className="flex items-center justify-between text-sm font-medium text-ink/70">
              Include drinks
              <input
                type="checkbox"
                checked={includesDrinks}
                onChange={(e) => setIncludesDrinks(e.target.checked)}
                className="h-5 w-5 accent-ocean-500"
              />
            </label>
          </div>
        )}

        {(type === "activity" || type === "transport" || type === "other") && (
          <div className="mb-3 grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-3">
            <Labeled label="Per person ($)">
              <input
                type="number"
                min={0}
                className="select"
                value={perPerson || ""}
                onChange={(e) => setPerPerson(Number(e.target.value))}
              />
            </Labeled>
            <Labeled label="Flat fees ($)">
              <input
                type="number"
                min={0}
                className="select"
                value={flat || ""}
                onChange={(e) => setFlat(Number(e.target.value))}
              />
            </Labeled>
          </div>
        )}

        {type === "lodging" && (
          <div className="mb-3 grid grid-cols-2 gap-3 rounded-2xl bg-surface-2 p-3">
            <Labeled label="Nightly total ($)">
              <input
                type="number"
                min={0}
                className="select"
                value={flat || ""}
                onChange={(e) => setFlat(Number(e.target.value))}
              />
            </Labeled>
            <Labeled label="Nights">
              <input
                type="number"
                min={1}
                className="select"
                value={nights}
                onChange={(e) => setNights(Math.max(1, Number(e.target.value)))}
              />
            </Labeled>
          </div>
        )}

        {/* live estimate */}
        <div className="mb-4 rounded-2xl border border-ocean-100 bg-ocean-50 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-ocean-700">
              Estimated total
            </span>
            <span className="text-2xl font-extrabold text-ocean-700">
              {money(breakdown.total)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ocean-700/70">
            {money(breakdown.perPerson)} / person · {breakdown.note}
          </p>
        </div>

        <button
          onClick={submit}
          disabled={!title.trim()}
          className="w-full rounded-xl bg-ocean-500 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-50"
        >
          Add item
        </button>
      </div>

      <style jsx global>{`
        .select {
          width: 100%;
          border-radius: 0.625rem;
          border: 1px solid rgb(var(--line));
          background: rgb(var(--surface));
          color: rgb(var(--ink));
          padding: 0.5rem 0.625rem;
          outline: none;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
