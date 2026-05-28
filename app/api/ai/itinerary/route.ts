import { NextResponse } from "next/server";
import { aiConfigured, complete } from "@/lib/ai/provider";
import {
  fallbackSuggest,
  parseSuggestions,
  type SuggestRequest,
} from "@/lib/ai/suggest";

export const runtime = "nodejs"; // Vercel serverless function

export async function POST(req: Request) {
  let body: SuggestRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const request: SuggestRequest = {
    destination: body.destination || "your destination",
    days: Math.min(14, Math.max(1, Number(body.days) || 3)),
    partySize: Math.max(1, Number(body.partySize) || 2),
    budgetPerPerson: Math.max(0, Number(body.budgetPerPerson) || 1000),
    interests: Array.isArray(body.interests) ? body.interests : [],
  };

  // No key configured → deterministic local plan. App stays fully functional.
  if (!aiConfigured()) {
    return NextResponse.json({
      source: "fallback",
      items: fallbackSuggest(request),
    });
  }

  try {
    const sys = `You are an expert travel planner. Return ONLY valid JSON of the form:
{"items":[{"title":string,"type":"restaurant"|"activity"|"lodging"|"transport"|"other","day":number,"time":"HH:MM","category":"lodging"|"flights"|"food"|"activities"|"transportation"|"misc","reason":string,"estimate":{...}}]}
The "estimate" object must be one of:
- restaurant: {"kind":"restaurant","partySize":N,"priceTier":1|2|3|4,"mealType":"breakfast"|"lunch"|"dinner","includesDrinks":boolean}
- activity/transport: {"kind":"activity","partySize":N,"perPerson":number,"flat":number}
- lodging: {"kind":"lodging","partySize":N,"flat":nightlyTotal,"nights":number}
Keep total per-person spend near the budget. No prose outside JSON.`;
    const user = `Plan a ${request.days}-day trip to ${request.destination} for ${request.partySize} people. Budget ~$${request.budgetPerPerson}/person. Interests: ${request.interests.join(", ") || "general"}.`;

    const text = await complete(
      [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      { maxTokens: 1500, json: true },
    );
    const items = parseSuggestions(text);
    if (!items || items.length === 0) {
      return NextResponse.json({
        source: "fallback",
        items: fallbackSuggest(request),
      });
    }
    return NextResponse.json({ source: "ai", items });
  } catch {
    // Any provider failure degrades gracefully to the local planner.
    return NextResponse.json({
      source: "fallback",
      items: fallbackSuggest(request),
    });
  }
}
