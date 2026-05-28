import type {
  ExpenseCategory,
  ItineraryEstimateInput,
  ItineraryType,
} from "@/lib/types";

export interface SuggestedItem {
  title: string;
  type: ItineraryType;
  day: number;
  time: string;
  category: ExpenseCategory;
  reason: string;
  estimate: ItineraryEstimateInput;
}

export interface SuggestRequest {
  destination: string;
  days: number;
  partySize: number;
  budgetPerPerson: number;
  interests: string[];
}

const TYPE_TO_CATEGORY: Record<ItineraryType, ExpenseCategory> = {
  restaurant: "food",
  activity: "activities",
  lodging: "lodging",
  transport: "transportation",
  other: "misc",
};

// Deterministic, plausible itinerary used when no AI provider is configured.
// Scales price tier with the per-person budget and picks activities by interest.
export function fallbackSuggest(req: SuggestRequest): SuggestedItem[] {
  const party = Math.max(1, req.partySize);
  const tier: 1 | 2 | 3 | 4 =
    req.budgetPerPerson >= 2500
      ? 4
      : req.budgetPerPerson >= 1500
        ? 3
        : req.budgetPerPerson >= 800
          ? 2
          : 1;

  const interest = (k: string) =>
    req.interests.map((i) => i.toLowerCase()).some((i) => i.includes(k));

  const activityPool: { title: string; perPerson: number; when: string }[] = [];
  if (interest("beach")) activityPool.push({ title: "Beach day & cabana", perPerson: 45, when: "11:00" });
  if (interest("night")) activityPool.push({ title: "Rooftop bar & club night", perPerson: 60, when: "22:30" });
  if (interest("outdoor") || interest("adventure")) activityPool.push({ title: "Guided outdoor excursion", perPerson: 95, when: "09:30" });
  if (interest("museum") || interest("culture")) activityPool.push({ title: "Museum & old town walk", perPerson: 25, when: "14:00" });
  if (interest("shopping")) activityPool.push({ title: "Shopping district stroll", perPerson: 0, when: "16:00" });
  if (interest("luxury")) activityPool.push({ title: "Spa & wellness afternoon", perPerson: 140, when: "15:00" });
  if (activityPool.length === 0)
    activityPool.push(
      { title: "City highlights tour", perPerson: 40, when: "10:00" },
      { title: "Sunset boat cruise", perPerson: 70, when: "18:00" },
    );

  const items: SuggestedItem[] = [];
  items.push(mk({
    title: `${req.destination} stay`,
    type: "lodging",
    day: 1,
    time: "15:00",
    reason: "Central base for the group, split across nights.",
    estimate: { kind: "lodging", partySize: party, flat: tier * 140, nights: Math.max(1, req.days - 1) },
  }));

  for (let day = 1; day <= req.days; day++) {
    // breakfast / dinner anchors each day
    items.push(mk({
      title: day === 1 ? "Welcome dinner" : "Group dinner",
      type: "restaurant",
      day,
      time: "20:00",
      reason: interest("food")
        ? "Foodie pick matched to your budget tier."
        : "A solid spot for the whole group.",
      estimate: { kind: "restaurant", partySize: party, priceTier: tier, mealType: "dinner", includesDrinks: true },
    }));
    const act = activityPool[(day - 1) % activityPool.length];
    items.push(mk({
      title: act.title,
      type: "activity",
      day,
      time: act.when,
      reason: "Chosen from your selected interests.",
      estimate: { kind: "activity", partySize: party, perPerson: act.perPerson },
    }));
  }

  return items;
}

function mk(
  s: Omit<SuggestedItem, "category"> & { type: ItineraryType },
): SuggestedItem {
  return { ...s, category: TYPE_TO_CATEGORY[s.type] };
}

// Robustly pull a SuggestedItem[] out of an AI JSON response.
export function parseSuggestions(raw: string): SuggestedItem[] | null {
  try {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const arr = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((x: any) => x && x.title && x.estimate)
      .map((x: any) => ({
        title: String(x.title),
        type: (x.type ?? "activity") as ItineraryType,
        day: Number(x.day) || 1,
        time: String(x.time ?? "12:00"),
        category: (x.category ?? TYPE_TO_CATEGORY[(x.type ?? "activity") as ItineraryType]) as ExpenseCategory,
        reason: String(x.reason ?? ""),
        estimate: x.estimate as ItineraryEstimateInput,
      }));
  } catch {
    return null;
  }
}
