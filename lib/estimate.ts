import type { ItineraryEstimateInput, ExpenseCategory } from "./types";

// ---------------------------------------------------------------------------
// Smart Spending Estimator
// ---------------------------------------------------------------------------
// This is the product's differentiator. It is intentionally HONEST: it returns
// a heuristic estimate, not a quote. When we wire in Yelp/Google Places/Viator
// later, real price data can replace these baselines without changing callers.
//
// Restaurant model:  per-person = baseEntrée(priceTier, meal) + drinks?
//                    then add tax + tip, multiply by party size.
// Activity model:    per-person ticket × party size (+ optional flat fees).
// Lodging model:     flat nightly × nights (split happens in the dashboard).
// ---------------------------------------------------------------------------

const TAX_RATE = 0.09; // sales tax, US-ish average
const TIP_RATE = 0.18; // dining gratuity

// Average entrée price by price tier ($ → $$$$) and meal.
const ENTREE_BASE: Record<number, Record<string, number>> = {
  1: { breakfast: 9, lunch: 12, dinner: 16 },
  2: { breakfast: 15, lunch: 20, dinner: 30 },
  3: { breakfast: 24, lunch: 34, dinner: 52 },
  4: { breakfast: 38, lunch: 55, dinner: 85 },
};

const DRINKS_BY_TIER: Record<number, number> = { 1: 8, 2: 14, 3: 22, 4: 32 };

export interface EstimateBreakdown {
  total: number;
  perPerson: number;
  lines: { label: string; amount: number }[];
  note: string;
}

export function estimate(input: ItineraryEstimateInput): EstimateBreakdown {
  const party = Math.max(1, input.partySize || 1);

  if (input.kind === "restaurant") {
    const tier = input.priceTier ?? 2;
    const meal = input.mealType ?? "dinner";
    const entree = ENTREE_BASE[tier][meal];
    const drinks = input.includesDrinks ? DRINKS_BY_TIER[tier] : 0;
    const subPerPerson = entree + drinks;
    const taxPerPerson = subPerPerson * TAX_RATE;
    const tipPerPerson = subPerPerson * TIP_RATE;
    const perPerson = subPerPerson + taxPerPerson + tipPerPerson;
    const total = perPerson * party;
    return {
      total: round(total),
      perPerson: round(perPerson),
      lines: [
        { label: `Entrée × ${party}`, amount: round(entree * party) },
        ...(drinks
          ? [{ label: `Drinks × ${party}`, amount: round(drinks * party) }]
          : []),
        { label: "Tax (9%)", amount: round(taxPerPerson * party) },
        { label: "Tip (18%)", amount: round(tipPerPerson * party) },
      ],
      note: "Estimate based on price tier, meal & party size.",
    };
  }

  if (input.kind === "lodging") {
    const nightly = input.flat ?? (input.perPerson ?? 0) * party;
    const nights = Math.max(1, input.nights ?? 1);
    const total = nightly * nights;
    return {
      total: round(total),
      perPerson: round(total / party),
      lines: [{ label: `${nights} night(s) × $${nightly}`, amount: round(total) }],
      note: "Nightly rate × nights, split across the group.",
    };
  }

  // activity / transport / flat
  const perPersonInput = input.perPerson ?? 0;
  const flat = input.flat ?? 0;
  const total = perPersonInput * party + flat;
  return {
    total: round(total),
    perPerson: round(total / party),
    lines: [
      ...(perPersonInput
        ? [{ label: `Ticket × ${party}`, amount: round(perPersonInput * party) }]
        : []),
      ...(flat ? [{ label: "Fees", amount: round(flat) }] : []),
    ],
    note: "Per-person price × party, plus any flat fees.",
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  lodging: "Lodging",
  flights: "Flights",
  food: "Food",
  activities: "Activities",
  transportation: "Transport",
  misc: "Misc",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  lodging: "#0084d1",
  flights: "#02a6f5",
  food: "#ff6b35",
  activities: "#ff8a4c",
  transportation: "#75d4ff",
  misc: "#94a3b8",
};
