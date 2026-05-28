// Core domain types for TravelApp.
// These mirror the Supabase schema in supabase/schema.sql so the local demo
// store and the real backend stay interchangeable.

export type InviteStatus = "pending" | "accepted" | "declined" | "maybe";
export type MemberRole = "host" | "member";

export type ItineraryType =
  | "restaurant"
  | "activity"
  | "lodging"
  | "transport"
  | "other";

export type ExpenseCategory =
  | "lodging"
  | "flights"
  | "food"
  | "activities"
  | "transportation"
  | "misc";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Trip {
  id: string;
  hostId: string;
  name: string;
  destination: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  coverColor: string; // gradient key for the cover card
  inviteCode: string;
  createdAt: string;
}

export interface TripMember {
  tripId: string;
  userId: string;
  name: string;
  status: InviteStatus;
  role: MemberRole;
}

export interface Vote {
  userId: string;
  value: "yes" | "no" | "must"; // ❤️ want / 👎 skip / 🔥 must-do
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  type: ItineraryType;
  title: string;
  location?: string;
  day: number; // 1-based day index within the trip
  time?: string; // e.g. "19:00"
  category: ExpenseCategory;
  // Inputs used by the estimator (see lib/estimate.ts)
  estimate: ItineraryEstimateInput;
  estimatedCost: number; // total for the whole group, computed
  createdBy: string;
  votes: Vote[];
  createdAt: string;
}

export interface ItineraryEstimateInput {
  kind: "restaurant" | "activity" | "lodging" | "transport" | "flat";
  partySize: number;
  // restaurant
  priceTier?: 1 | 2 | 3 | 4; // $, $$, $$$, $$$$
  mealType?: "breakfast" | "lunch" | "dinner";
  includesDrinks?: boolean;
  // activity / lodging / transport / flat
  perPerson?: number; // explicit per-person price if known
  flat?: number; // explicit flat total if known
  nights?: number; // for lodging
}
