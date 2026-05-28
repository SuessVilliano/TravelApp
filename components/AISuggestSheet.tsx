"use client";

import { useState } from "react";
import { Check, Plus, Sparkles, X } from "lucide-react";
import { Spinner } from "./Loader";
import { money } from "@/lib/format";
import { estimate } from "@/lib/estimate";
import type { AddItemInput } from "@/lib/db";
import type { SuggestedItem } from "@/lib/ai/suggest";

const INTERESTS = [
  "Nightlife", "Foodie", "Beaches", "Outdoors",
  "Museums", "Luxury", "Shopping", "Hidden gems", "Family",
];

export function AISuggestSheet({
  destination,
  days,
  partySize,
  onClose,
  onAdd,
}: {
  destination: string;
  days: number;
  partySize: number;
  onClose: () => void;
  onAdd: (input: AddItemInput) => Promise<void>;
}) {
  const [interests, setInterests] = useState<string[]>(["Foodie", "Beaches"]);
  const [budget, setBudget] = useState(1200);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedItem[] | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());

  function toggle(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  }

  async function generate() {
    setBusy(true);
    setSuggestions(null);
    try {
      const res = await fetch("/api/ai/itinerary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destination,
          days,
          partySize,
          budgetPerPerson: budget,
          interests,
        }),
      });
      const data = await res.json();
      setSource(data.source);
      setSuggestions(data.items ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function add(s: SuggestedItem, idx: number) {
    await onAdd({
      type: s.type,
      title: s.title,
      day: s.day,
      time: s.time,
      category: s.category,
      estimate: s.estimate,
    });
    setAdded((prev) => new Set(prev).add(idx));
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="no-scrollbar max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sunset-500" />
            <h2 className="text-lg font-bold">AI Trip Planner</h2>
          </div>
          <button onClick={onClose} className="text-muted">
            <X size={22} />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted">
          {days}-day trip to {destination} · {partySize} people
        </p>

        <label className="mb-1 block text-sm font-medium text-ink/80">
          Interests
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                interests.includes(i)
                  ? "bg-ocean-500 text-white"
                  : "bg-surface-2 text-ink/70"
              }`}
            >
              {i}
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-ink/80">
          Budget per person:{" "}
          <span className="font-bold text-ocean-600">{money(budget)}</span>
        </label>
        <input
          type="range"
          min={300}
          max={4000}
          step={100}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="mb-4 w-full accent-ocean-500"
        />

        <button
          onClick={generate}
          disabled={busy}
          className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-500 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? (
            <>
              <Spinner size={18} /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Generate itinerary
            </>
          )}
        </button>

        {suggestions && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-muted">
                {suggestions.length} suggestions
              </h3>
              {source === "fallback" && (
                <span className="text-[11px] text-muted">
                  smart defaults · add an AI key for personalized plans
                </span>
              )}
            </div>
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ocean-600">
                      Day {s.day} · {s.time}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase text-muted">
                      {s.type}
                    </span>
                  </div>
                  <p className="mt-0.5 font-semibold leading-tight">{s.title}</p>
                  {s.reason && (
                    <p className="text-xs text-muted">{s.reason}</p>
                  )}
                  <p className="mt-0.5 text-sm font-bold">
                    {money(estimate(s.estimate).total)}
                  </p>
                </div>
                <button
                  onClick={() => add(s, idx)}
                  disabled={added.has(idx)}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    added.has(idx)
                      ? "bg-green-100 text-green-600"
                      : "bg-ocean-500 text-white"
                  }`}
                >
                  {added.has(idx) ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
