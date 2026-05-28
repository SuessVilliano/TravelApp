"use client";

import { useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { Spinner } from "./Loader";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Best sushi near our hotel under $50pp?",
  "What should we do on a rainy day?",
  "Plan a fun night out for the group",
];

export function ConciergeSheet({
  context,
  onClose,
}: {
  context: {
    destination?: string;
    days?: number;
    partySize?: number;
    budgetPerPerson?: number;
    itinerary?: string[];
  };
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi! I'm your trip concierge for ${context.destination ?? "your trip"}. Ask me anything — restaurants, budgets, what to do.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);
    const next = [...messages, { role: "user" as const, content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, context, history }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.answer ?? "Sorry, try again." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error — please try again." },
      ]);
    } finally {
      setBusy(false);
      setTimeout(
        () => scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }),
        50,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col justify-end bg-black/40">
      <div className="flex h-[85dvh] flex-col rounded-t-3xl bg-surface">
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-sunset-500" />
            <h2 className="font-bold">AI Concierge</h2>
          </div>
          <button onClick={onClose} className="text-muted">
            <X size={22} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === "user"
                  ? "ml-auto bg-ocean-500 text-white"
                  : "bg-surface-2 text-ink"
              }`}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size={16} /> thinking…
            </div>
          )}
          {messages.length <= 1 && (
            <div className="space-y-2 pt-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm text-ink/80"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask the concierge…"
            className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-ocean-400"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ocean-500 text-white disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
