# VoyageCircle 🌍

A collaborative, AI-powered group trip planner — plan together, split the cost,
keep the memories. Mobile-first web app built with **Next.js + Supabase**,
deployable to **Vercel**.

> Positioning: *Instagram meets collaborative vacation planning.* It covers the
> full trip lifecycle — **before** (plan + budget), **during** (coordinate +
> spend), **after** (memories/profile).

## ✨ What's built (MVP)

- **Auth** — magic-link (Supabase) or zero-setup demo mode.
- **Create trip** — name, destination, dates, themed cover.
- **Invite friends** — shareable invite link + code; accept / maybe / decline.
- **Shared itinerary** — day-by-day timeline, item types, group voting
  (❤️ want / 🔥 must-do / 👎 skip).
- **Smart spending estimator** — heuristic restaurant/activity/lodging costs;
  live per-person totals.
- **Budget dashboard** — trip total, per-person split, category breakdown bars.
- **AI Trip Planner** — generates a full itinerary from interests + budget.
- **AI Concierge** — in-trip chat ("best sushi near our hotel under $50pp?").
- **Travel profile** — travel identity, stats, trips grid.
- **Explore** — inspirational discovery feed.
- **Light / dark theme** toggle + animated loading screens, fully mobile-optimized.

## 🏃 Run locally

```bash
npm install
npm run dev   # http://localhost:3000
```

The app runs in **demo mode** out of the box — no backend or keys needed. Data
is saved to your browser's localStorage and one example trip is seeded.

## 🔌 Going live (optional)

Copy `.env.example` → `.env.local` and fill in keys:

1. **Supabase** (real multi-user backend)
   - Create a project at <https://supabase.com>
   - Run `supabase/schema.sql` in the SQL editor (tables + RLS)
   - Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. **AI** (personalized planner + concierge)
   - Set `ANTHROPIC_API_KEY` (preferred) **or** `OPENAI_API_KEY`
   - Without a key, smart deterministic fallbacks keep everything working.

> The data layer (`lib/db`) auto-selects Supabase when its env vars are present,
> otherwise localStorage — no code changes required.

## 🚀 Deploy to Vercel

This is a standard Next.js app — Vercel auto-detects it. API routes
(`/api/ai/*`) run as serverless functions. Add any env vars in the Vercel
project settings, then deploy. It works with **zero** env vars too (demo +
fallback AI).

## 🗺️ Architecture

```
app/                Next.js App Router pages
  api/ai/*          Serverless AI endpoints (Anthropic/OpenAI + fallback)
components/         UI components (sheets, nav, theme, loaders)
lib/
  db/               Data layer: index (facade) + local + supabase impls
  ai/               AI provider abstraction + suggestion engine
  estimate.ts       Smart spending estimator (the differentiator)
  types.ts          Domain types (mirror supabase/schema.sql)
supabase/schema.sql Postgres schema + Row Level Security
```

## 🧭 Roadmap (next)

Shared photo albums & AI recap reels · friend graph & social feed ·
real place/price data (Yelp/Google Places/Viator) · payment split (Stripe/Venmo)
· push notifications.
