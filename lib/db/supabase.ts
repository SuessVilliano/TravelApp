// Supabase-backed implementation of DataStore.
// Activated automatically when NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set.
// Tables & RLS are defined in supabase/schema.sql.
//
// Auth uses magic-link (passwordless) OTP — see signIn(). On first sign-in we
// upsert a row into `profiles` so we can show display names.

import { estimate } from "@/lib/estimate";
import { getSupabase } from "@/lib/supabase/client";
import type { ItineraryItem, Trip, TripMember, User } from "@/lib/types";
import type { AddItemInput, CreateTripInput, DataStore } from "./index";

function inviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function mapTrip(r: any): Trip {
  return {
    id: r.id,
    hostId: r.host_id,
    name: r.name,
    destination: r.destination,
    startDate: r.start_date,
    endDate: r.end_date,
    coverColor: r.cover_color,
    inviteCode: r.invite_code,
    createdAt: r.created_at,
  };
}

function mapItem(r: any): ItineraryItem {
  return {
    id: r.id,
    tripId: r.trip_id,
    type: r.type,
    title: r.title,
    location: r.location ?? undefined,
    day: r.day,
    time: r.time ?? undefined,
    category: r.category,
    estimate: r.estimate,
    estimatedCost: Number(r.estimated_cost),
    createdBy: r.created_by,
    votes: r.votes ?? [],
    createdAt: r.created_at,
  };
}

export const supabaseStore: DataStore = {
  async getCurrentUser() {
    const sb = getSupabase();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await sb
      .from("profiles")
      .select("name,email")
      .eq("id", data.user.id)
      .single();
    return {
      id: data.user.id,
      name: profile?.name ?? data.user.email ?? "Traveler",
      email: profile?.email ?? data.user.email ?? "",
    };
  },

  async signIn(name, email) {
    const sb = getSupabase();
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    // Profile name is persisted on first authenticated load; for now return a
    // provisional user so the UI can show a "check your email" state.
    return { id: "pending", name, email };
  },

  async signOut() {
    await getSupabase().auth.signOut();
  },

  async listTrips() {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("trips")
      .select("*")
      .order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTrip);
  },

  async getTrip(id) {
    const sb = getSupabase();
    const { data } = await sb.from("trips").select("*").eq("id", id).single();
    return data ? mapTrip(data) : null;
  },

  async getTripByInviteCode(code) {
    const sb = getSupabase();
    const { data } = await sb
      .from("trips")
      .select("*")
      .eq("invite_code", code.toUpperCase())
      .single();
    return data ? mapTrip(data) : null;
  },

  async createTrip(input: CreateTripInput) {
    const sb = getSupabase();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await sb
      .from("trips")
      .insert({
        host_id: user.id,
        name: input.name,
        destination: input.destination,
        start_date: input.startDate,
        end_date: input.endDate,
        cover_color: input.coverColor,
        invite_code: inviteCode(),
      })
      .select("*")
      .single();
    if (error) throw error;
    await sb.from("trip_members").insert({
      trip_id: data.id,
      user_id: user.id,
      name: user.name,
      status: "accepted",
      role: "host",
    });
    return mapTrip(data);
  },

  async listMembers(tripId) {
    const sb = getSupabase();
    const { data } = await sb
      .from("trip_members")
      .select("*")
      .eq("trip_id", tripId);
    return (data ?? []).map(
      (r: any): TripMember => ({
        tripId: r.trip_id,
        userId: r.user_id,
        name: r.name,
        status: r.status,
        role: r.role,
      }),
    );
  },

  async joinTrip(tripId, status) {
    const sb = getSupabase();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Not signed in");
    await sb.from("trip_members").upsert(
      {
        trip_id: tripId,
        user_id: user.id,
        name: user.name,
        status,
        role: "member",
      },
      { onConflict: "trip_id,user_id" },
    );
  },

  async listItems(tripId) {
    const sb = getSupabase();
    const { data } = await sb
      .from("itinerary_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("day", { ascending: true })
      .order("time", { ascending: true });
    return (data ?? []).map(mapItem);
  },

  async addItem(tripId, input: AddItemInput) {
    const sb = getSupabase();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await sb
      .from("itinerary_items")
      .insert({
        trip_id: tripId,
        type: input.type,
        title: input.title,
        location: input.location,
        day: input.day,
        time: input.time,
        category: input.category,
        estimate: input.estimate,
        estimated_cost: estimate(input.estimate).total,
        created_by: user.id,
        votes: [],
      })
      .select("*")
      .single();
    if (error) throw error;
    return mapItem(data);
  },

  async voteItem(itemId, value) {
    const sb = getSupabase();
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Not signed in");
    const { data } = await sb
      .from("itinerary_items")
      .select("votes")
      .eq("id", itemId)
      .single();
    const votes: { userId: string; value: string }[] = data?.votes ?? [];
    const existing = votes.find((v) => v.userId === user.id);
    let next: typeof votes;
    if (existing && existing.value === value) {
      next = votes.filter((v) => v.userId !== user.id);
    } else if (existing) {
      next = votes.map((v) => (v.userId === user.id ? { ...v, value } : v));
    } else {
      next = [...votes, { userId: user.id, value }];
    }
    await sb.from("itinerary_items").update({ votes: next }).eq("id", itemId);
  },

  async deleteItem(itemId) {
    await getSupabase().from("itinerary_items").delete().eq("id", itemId);
  },
};
