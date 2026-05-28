import { initials } from "@/lib/format";

const PALETTE = ["#02a6f5", "#ff6b35", "#0069a9", "#ff8a4c", "#094a73", "#75d4ff"];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white"
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(name),
        fontSize: size * 0.4,
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
