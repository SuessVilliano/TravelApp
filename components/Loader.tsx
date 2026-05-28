import { Plane } from "lucide-react";

// Branded full-screen animated splash — used while auth/data resolves.
export function Splash({ label = "Loading your trips…" }: { label?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-page">
      <div className="relative h-20 w-20">
        <span className="absolute inset-0 rounded-full bg-ocean-500/20" />
        <span className="absolute inset-0 animate-ping rounded-full bg-ocean-500/20" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Plane size={34} className="animate-float text-ocean-500" />
        </span>
      </div>
      <div className="flex items-center gap-2 text-ink">
        <span className="text-lg font-bold tracking-tight">VoyageCircle</span>
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

// Inline spinner for buttons / small areas.
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-white/40 border-t-white"
      style={{ width: size, height: size }}
    />
  );
}

// Skeleton placeholder block.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

// Skeleton list for trip cards.
export function TripListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-44" />
      <Skeleton className="h-44" />
    </div>
  );
}
