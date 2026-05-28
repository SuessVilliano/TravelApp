// Data-access facade. Every page/component imports from here and never talks
// to a backend directly. Today it resolves to the localStorage demo store;
// once Supabase env vars are set it resolves to the Supabase implementation.
//
// Both implementations satisfy the same async interface, so swapping backends
// is a one-line change with zero call-site edits.

import { isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  ItineraryEstimateInput,
  ItineraryItem,
  ItineraryType,
  ExpenseCategory,
  Trip,
  TripMember,
  User,
} from "@/lib/types";

export interface CreateTripInput {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverColor: string;
}

export interface AddItemInput {
  type: ItineraryType;
  title: string;
  location?: string;
  day: number;
  time?: string;
  category: ExpenseCategory;
  estimate: ItineraryEstimateInput;
}

export interface DataStore {
  getCurrentUser(): Promise<User | null>;
  signIn(name: string, email: string): Promise<User>;
  signOut(): Promise<void>;

  listTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  getTripByInviteCode(code: string): Promise<Trip | null>;
  createTrip(input: CreateTripInput): Promise<Trip>;

  listMembers(tripId: string): Promise<TripMember[]>;
  joinTrip(tripId: string, status: TripMember["status"]): Promise<void>;

  listItems(tripId: string): Promise<ItineraryItem[]>;
  addItem(tripId: string, input: AddItemInput): Promise<ItineraryItem>;
  voteItem(itemId: string, value: "yes" | "no" | "must"): Promise<void>;
  deleteItem(itemId: string): Promise<void>;
}

let store: DataStore | null = null;

export async function db(): Promise<DataStore> {
  if (store) return store;
  if (isSupabaseConfigured) {
    const mod = await import("./supabase");
    store = mod.supabaseStore;
  } else {
    const mod = await import("./local");
    store = mod.localStore;
  }
  return store;
}

export const usingLocalMode = !isSupabaseConfigured;
