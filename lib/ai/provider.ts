// Server-side AI provider abstraction.
//
// Resolves to whichever key is configured, preferring Anthropic (Claude):
//   - ANTHROPIC_API_KEY  -> Claude (recommended, latest models)
//   - OPENAI_API_KEY     -> OpenAI
//   - neither            -> caller should use its local fallback
//
// Exposes a single `complete()` that returns assistant text. Keep all network
// calls here so routes stay thin.

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export function aiProvider(): "anthropic" | "openai" | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export async function complete(
  messages: AIMessage[],
  opts: { maxTokens?: number; json?: boolean } = {},
): Promise<string> {
  const provider = aiProvider();
  if (provider === "anthropic") return completeAnthropic(messages, opts);
  if (provider === "openai") return completeOpenAI(messages, opts);
  throw new Error("No AI provider configured");
}

async function completeAnthropic(
  messages: AIMessage[],
  opts: { maxTokens?: number; json?: boolean },
): Promise<string> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: opts.maxTokens ?? 1024,
      system: system || undefined,
      messages: turns,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function completeOpenAI(
  messages: AIMessage[],
  opts: { maxTokens?: number; json?: boolean },
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      max_tokens: opts.maxTokens ?? 1024,
      messages,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
