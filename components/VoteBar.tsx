"use client";

import type { Vote } from "@/lib/types";

const OPTIONS: { value: Vote["value"]; emoji: string; label: string }[] = [
  { value: "yes", emoji: "❤️", label: "Want" },
  { value: "must", emoji: "🔥", label: "Must-do" },
  { value: "no", emoji: "👎", label: "Skip" },
];

export function VoteBar({
  votes,
  myUserId,
  onVote,
}: {
  votes: Vote[];
  myUserId: string;
  onVote: (value: Vote["value"]) => void;
}) {
  const mine = votes.find((v) => v.userId === myUserId)?.value;
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((o) => {
        const count = votes.filter((v) => v.value === o.value).length;
        const active = mine === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onVote(o.value)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              active
                ? "border-ocean-400 bg-ocean-50 text-ocean-700"
                : "border-line bg-surface text-muted"
            }`}
          >
            <span>{o.emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
