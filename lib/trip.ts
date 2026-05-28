import type { ExpenseCategory, ItineraryItem } from "./types";

export interface TripTotals {
  total: number;
  perPerson: number;
  byCategory: { category: ExpenseCategory; amount: number }[];
}

export function computeTotals(
  items: ItineraryItem[],
  acceptedMembers: number,
): TripTotals {
  const total = items.reduce((s, i) => s + i.estimatedCost, 0);
  const map = new Map<ExpenseCategory, number>();
  for (const i of items) {
    map.set(i.category, (map.get(i.category) ?? 0) + i.estimatedCost);
  }
  const byCategory = Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const heads = Math.max(1, acceptedMembers);
  return { total, perPerson: total / heads, byCategory };
}
