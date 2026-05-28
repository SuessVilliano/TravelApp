// localStorage-backed implementation of DataStore — powers the zero-setup demo.
// All data lives in the browser. Seeds one example trip on first run so the app
// never opens empty.

import { estimate } from "@/lib/estimate";
import type {
  ItineraryItem,
  Trip,
  TripMember,
  User,
} from "@/lib/types";
import type { AddItemInput, CreateTripInput, DataStore } from "./index";

const K_USER = "travelapp.user";
const K_TRIPS = "travelapp.trips";
const K_MEMBERS = "travelapp.members";
const K_ITEMS = "travelapp.items";
const K_SEEDED = "travelapp.seeded";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function inviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function ensureSeed() {
  if (typeof window === "undefined") return;
  if (read(K_SEEDED, false)) return;
  write(K_SEEDED, true);

  const host: User = read<User | null>(K_USER, null) ?? {
    id: uid("usr"),
    name: "You",
    email: "you@example.com",
  };
  write(K_USER, host);

  const trip: Trip = {
    id: uid("trip"),
    hostId: host.id,
    name: "Miami Crew 2026",
    destination: "Miami, FL",
    startDate: "2026-07-10",
    endDate: "2026-07-13",
    coverColor: "ocean",
    inviteCode: inviteCode(),
    createdAt: new Date().toISOString(),
  };
  write(K_TRIPS, [trip]);

  const members: TripMember[] = [
    { tripId: trip.id, userId: host.id, name: "You", status: "accepted", role: "host" },
    { tripId: trip.id, userId: uid("usr"), name: "Sarah", status: "accepted", role: "member" },
    { tripId: trip.id, userId: uid("usr"), name: "Marcus", status: "maybe", role: "member" },
    { tripId: trip.id, userId: uid("usr"), name: "Priya", status: "pending", role: "member" },
  ];
  write(K_MEMBERS, members);

  const party = 4;
  const mk = (i: Omit<AddItemInput, "estimate"> & { estimate: AddItemInput["estimate"] }, createdBy: string): ItineraryItem => ({
    id: uid("item"),
    tripId: trip.id,
    ...i,
    estimatedCost: estimate(i.estimate).total,
    createdBy,
    votes: [],
    createdAt: new Date().toISOString(),
  });

  const items: ItineraryItem[] = [
    mk({ type: "lodging", title: "South Beach Airbnb", location: "Ocean Dr", day: 1, time: "15:00", category: "lodging", estimate: { kind: "lodging", partySize: party, flat: 420, nights: 3 } }, host.id),
    mk({ type: "restaurant", title: "Rooftop sushi dinner", location: "Brickell", day: 1, time: "20:00", category: "food", estimate: { kind: "restaurant", partySize: party, priceTier: 3, mealType: "dinner", includesDrinks: true } }, members[1].userId),
    mk({ type: "activity", title: "Jet ski rental", location: "Biscayne Bay", day: 2, time: "11:00", category: "activities", estimate: { kind: "activity", partySize: party, perPerson: 95 } }, host.id),
    mk({ type: "restaurant", title: "Beachfront brunch", location: "South Beach", day: 2, time: "10:00", category: "food", estimate: { kind: "restaurant", partySize: party, priceTier: 2, mealType: "breakfast", includesDrinks: false } }, members[1].userId),
    mk({ type: "activity", title: "Nightclub (LIV)", location: "Fontainebleau", day: 2, time: "23:00", category: "activities", estimate: { kind: "activity", partySize: party, perPerson: 60, flat: 200 } }, host.id),
  ];
  write(K_ITEMS, items);
}

export const localStore: DataStore = {
  async getCurrentUser() {
    ensureSeed();
    return read<User | null>(K_USER, null);
  },

  async signIn(name, email) {
    const existing = read<User | null>(K_USER, null);
    const user: User = existing ?? { id: uid("usr"), name, email };
    user.name = name || user.name;
    user.email = email || user.email;
    write(K_USER, user);
    ensureSeed();
    return user;
  },

  async signOut() {
    if (typeof window !== "undefined") window.localStorage.removeItem(K_USER);
  },

  async listTrips() {
    ensureSeed();
    return read<Trip[]>(K_TRIPS, []).sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
  },

  async getTrip(id) {
    ensureSeed();
    return read<Trip[]>(K_TRIPS, []).find((t) => t.id === id) ?? null;
  },

  async getTripByInviteCode(code) {
    ensureSeed();
    return (
      read<Trip[]>(K_TRIPS, []).find(
        (t) => t.inviteCode.toUpperCase() === code.toUpperCase(),
      ) ?? null
    );
  },

  async createTrip(input: CreateTripInput) {
    const user = (await this.getCurrentUser())!;
    const trip: Trip = {
      id: uid("trip"),
      hostId: user.id,
      ...input,
      inviteCode: inviteCode(),
      createdAt: new Date().toISOString(),
    };
    write(K_TRIPS, [...read<Trip[]>(K_TRIPS, []), trip]);
    const members = read<TripMember[]>(K_MEMBERS, []);
    members.push({
      tripId: trip.id,
      userId: user.id,
      name: user.name,
      status: "accepted",
      role: "host",
    });
    write(K_MEMBERS, members);
    return trip;
  },

  async listMembers(tripId) {
    return read<TripMember[]>(K_MEMBERS, []).filter((m) => m.tripId === tripId);
  },

  async joinTrip(tripId, status) {
    const user = (await this.getCurrentUser())!;
    const members = read<TripMember[]>(K_MEMBERS, []);
    const existing = members.find(
      (m) => m.tripId === tripId && m.userId === user.id,
    );
    if (existing) {
      existing.status = status;
    } else {
      members.push({
        tripId,
        userId: user.id,
        name: user.name,
        status,
        role: "member",
      });
    }
    write(K_MEMBERS, members);
  },

  async listItems(tripId) {
    return read<ItineraryItem[]>(K_ITEMS, [])
      .filter((i) => i.tripId === tripId)
      .sort((a, b) => a.day - b.day || (a.time ?? "").localeCompare(b.time ?? ""));
  },

  async addItem(tripId, input: AddItemInput) {
    const user = (await this.getCurrentUser())!;
    const item: ItineraryItem = {
      id: uid("item"),
      tripId,
      ...input,
      estimatedCost: estimate(input.estimate).total,
      createdBy: user.id,
      votes: [],
      createdAt: new Date().toISOString(),
    };
    write(K_ITEMS, [...read<ItineraryItem[]>(K_ITEMS, []), item]);
    return item;
  },

  async voteItem(itemId, value) {
    const user = (await this.getCurrentUser())!;
    const items = read<ItineraryItem[]>(K_ITEMS, []);
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const existing = item.votes.find((v) => v.userId === user.id);
    if (existing && existing.value === value) {
      item.votes = item.votes.filter((v) => v.userId !== user.id); // toggle off
    } else if (existing) {
      existing.value = value;
    } else {
      item.votes.push({ userId: user.id, value });
    }
    write(K_ITEMS, items);
  },

  async deleteItem(itemId) {
    write(
      K_ITEMS,
      read<ItineraryItem[]>(K_ITEMS, []).filter((i) => i.id !== itemId),
    );
  },
};
