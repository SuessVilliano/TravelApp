import { NextResponse } from "next/server";
import { aiConfigured, complete, type AIMessage } from "@/lib/ai/provider";

export const runtime = "nodejs";

interface ConciergeBody {
  question: string;
  context?: {
    destination?: string;
    days?: number;
    partySize?: number;
    budgetPerPerson?: number;
    itinerary?: string[];
  };
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: Request) {
  let body: ConciergeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = (body.question || "").trim();
  if (!question)
    return NextResponse.json({ error: "Empty question" }, { status: 400 });

  if (!aiConfigured()) {
    return NextResponse.json({ source: "fallback", answer: fallback(body) });
  }

  try {
    const ctx = body.context;
    const sys = `You are the in-app travel concierge for a group-trip planner.
Be concise, friendly and practical. Give specific, actionable suggestions
(named places, rough prices per person, time-of-day tips). Assume the user is
planning a group trip. Keep answers under ~120 words unless asked for detail.`;
    const ctxLine = ctx
      ? `Trip context: ${ctx.destination ?? "?"}, ${ctx.days ?? "?"} days, ${ctx.partySize ?? "?"} people, ~$${ctx.budgetPerPerson ?? "?"}/person. Current plan: ${(ctx.itinerary ?? []).join("; ") || "empty"}.`
      : "";

    const messages: AIMessage[] = [
      { role: "system", content: `${sys}\n${ctxLine}` },
      ...((body.history ?? []).slice(-6) as AIMessage[]),
      { role: "user", content: question },
    ];
    const answer = await complete(messages, { maxTokens: 500 });
    return NextResponse.json({ source: "ai", answer });
  } catch {
    return NextResponse.json({ source: "fallback", answer: fallback(body) });
  }
}

function fallback(body: ConciergeBody): string {
  const d = body.context?.destination ?? "your destination";
  const q = body.question.toLowerCase();
  if (q.includes("restaurant") || q.includes("eat") || q.includes("food"))
    return `For ${d}, mix one splurge dinner with casual lunches to balance the budget. Aim for $30–55/person at mid-range spots, and book group tables (5+) a few days ahead. Add picks to the itinerary and the budget tab will total them automatically.`;
  if (q.includes("budget") || q.includes("cost") || q.includes("split"))
    return `Track each item in the itinerary — the Budget tab gives you the trip total and per-person split instantly. A good rule for ${d}: ~40% lodging, 25% food, 25% activities, 10% transport. Settle up in Venmo after.`;
  if (q.includes("night") || q.includes("club") || q.includes("bar"))
    return `Nightlife in ${d}: pre-game at the rooftop near your stay, then one main venue. Budget $40–80/person with cover + a couple drinks. Add it as an "activity" so it lands in the group vote.`;
  return `Here's a quick take for ${d}: lock lodging first, then 1–2 anchor activities per day and leave evenings flexible. Add ideas to the itinerary so the group can vote (❤️ / 🔥 / 👎). Tip: set an AI key in your Vercel env vars to get fully personalized concierge answers.`;
}
