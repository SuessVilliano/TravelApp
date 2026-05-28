"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { Splash } from "@/components/Loader";
import type { User } from "@/lib/types";

// Client-side gate: ensures a signed-in user before rendering children.
// In local demo mode the store auto-provisions a "You" user, so this resolves
// instantly; with Supabase it redirects to /login when there's no session.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const store = await db();
      const u = await store.getCurrentUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setChecked(true);
    })();
  }, [router]);

  if (!checked || !user) {
    return <Splash label="Getting things ready…" />;
  }
  return <>{children}</>;
}
