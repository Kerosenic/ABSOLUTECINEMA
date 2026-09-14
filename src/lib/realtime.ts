// Supabase Realtime subscriptions. When a member (or admin) writes a vote,
// comment, or poll vote, the change is broadcast over postgres_changes and the
// affected React Query caches are invalidated so every client sees it live —
// no manual refresh. In mock mode (no .env) this is a no-op.

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, requireSupabase } from "./supabase";

export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = requireSupabase();
    const invalidate = (...keys: string[]) => qc.invalidateQueries({ queryKey: keys });

    const channels = [
      sb
        .channel("ac-review-votes")
        .on("postgres_changes", { event: "*", schema: "public", table: "review_votes" }, () =>
          invalidate("reviews", "myReviewVotes", "leaderboard"))
        .subscribe(),
      sb
        .channel("ac-comments")
        .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () =>
          invalidate("threads"))
        .subscribe(),
      sb
        .channel("ac-poll-votes")
        .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () =>
          invalidate("polls", "myPollVotes"))
        .subscribe(),
    ];

    return () => {
      channels.forEach((c) => sb.removeChannel(c));
    };
  }, [qc]);
}
