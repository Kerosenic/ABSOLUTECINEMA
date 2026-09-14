// React Query hooks. One hook per data domain; mutations invalidate the
// queries they touch so the UI stays in sync (optimistic via refetch).

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, requireSupabase } from "./supabase";
import { MOCK_USER } from "./mock";
import { setSession, useSession } from "./session";
import { fetchProfile } from "./api";
import * as api from "./api";
import type { VaultTab } from "./types";

export { useSession };

// ─── Auth bootstrap ───────────────────────────────────────────────────────────
export function useInitAuth() {
  const qc = useQueryClient();
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession({ user: MOCK_USER });
      return;
    }
    const sb = requireSupabase();
    let active = true;
    const apply = (userId: string | undefined) => {
      if (!userId) {
        setSession(null);
        qc.clear();
        return;
      }
      fetchProfile(userId).then((profile) => {
        if (active) setSession(profile ? { user: profile } : null);
      });
    };
    sb.auth.getSession().then(({ data }) => apply(data.session?.user?.id));
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => apply(s?.user?.id));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [qc]);
}

export function useAuth() {
  return {
    signIn: async (email: string, password: string) => {
      const s = await api.signInEmail(email, password);
      if (s) setSession(s);
      return s;
    },
    signUp: async (email: string, password: string, username: string) => {
      const s = await api.signUpEmail(email, password, username);
      if (s) setSession(s);
      return s;
    },
    signInGoogle: async () => {
      await api.signInGoogle();
    },
    signOut: async () => {
      await api.signOut();
      setSession(null);
    },
  };
}

// ─── Reads ────────────────────────────────────────────────────────────────────
export function useMovies() {
  return useQuery({ queryKey: ["movies"], queryFn: api.listMovies });
}

export function useReviews() {
  return useQuery({ queryKey: ["reviews"], queryFn: api.listReviews });
}

export function useThreads() {
  return useQuery({ queryKey: ["threads"], queryFn: api.listThreads });
}

export function usePolls() {
  return useQuery({ queryKey: ["polls"], queryFn: api.listPolls });
}

export function useScreenings() {
  return useQuery({ queryKey: ["screenings"], queryFn: api.listScreenings });
}

export function useLeaderboard() {
  return useQuery({ queryKey: ["leaderboard"], queryFn: api.getLeaderboard });
}

export function useMembers() {
  return useQuery({ queryKey: ["members"], queryFn: api.listMembers });
}

export function useVault() {
  const session = useSession();
  const uid = session?.user.id ?? "";
  return useQuery({ queryKey: ["vault", uid], queryFn: () => api.getVault(uid), enabled: !!uid });
}

export function useFollowing() {
  const session = useSession();
  const uid = session?.user.id ?? "";
  return useQuery({ queryKey: ["following", uid], queryFn: () => api.getFollowing(uid), enabled: !!uid });
}

export function useMyReviewVotes() {
  const session = useSession();
  const uid = session?.user.id ?? "";
  return useQuery({ queryKey: ["myReviewVotes", uid], queryFn: () => api.getMyReviewVotes(uid), enabled: !!uid });
}

export function useMyPollVotes() {
  const session = useSession();
  const uid = session?.user.id ?? "";
  return useQuery({ queryKey: ["myPollVotes", uid], queryFn: () => api.getMyPollVotes(uid), enabled: !!uid });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
function useInvalidatingMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  keys: string[][],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

export function useCreateReview() {
  return useInvalidatingMutation(api.createReview, [["reviews"], ["leaderboard"]]);
}

export function useVoteReview() {
  return useInvalidatingMutation(
    (args: { id: string; dir: "up" | "down" }) => api.voteReview(args.id, args.dir),
    [["reviews"], ["myReviewVotes"], ["leaderboard"]],
  );
}

export function useAddReply() {
  return useInvalidatingMutation(
    (args: { reviewId: string; body: string }) => api.addReply(args.reviewId, args.body),
    [["threads"]],
  );
}

export function useCastPollVote() {
  return useInvalidatingMutation(
    (args: { pollId: string; optionIndex: number }) => api.castPollVote(args.pollId, args.optionIndex),
    [["polls"], ["myPollVotes"]],
  );
}

export function useToggleFavorite() {
  return useInvalidatingMutation((id: string) => api.toggleFavorite(id), [["vault"]]);
}

export function useSetVaultStatus() {
  return useInvalidatingMutation(
    (args: { movieId: string; status: VaultTab }) => api.setVaultStatus(args.movieId, args.status),
    [["vault"]],
  );
}

export function useToggleFollow() {
  return useInvalidatingMutation((id: string) => api.toggleFollow(id), [["following"]]);
}

export function useAddScreening() {
  return useInvalidatingMutation(
    (args: Omit<import("./types").Screening, "id">) => api.addScreening(args),
    [["screenings"]],
  );
}

export function useDeleteScreening() {
  return useInvalidatingMutation((id: string) => api.deleteScreening(id), [["screenings"]]);
}

export function useAddPoll() {
  return useInvalidatingMutation(
    (args: { question: string; closes: string; options: string[] }) => api.addPoll(args),
    [["polls"]],
  );
}

export function useTogglePoll() {
  return useInvalidatingMutation((id: string) => api.togglePoll(id), [["polls"]]);
}

export function useDeletePoll() {
  return useInvalidatingMutation((id: string) => api.deletePoll(id), [["polls"]]);
}

export function useDeleteReview() {
  return useInvalidatingMutation(
    (id: string) => api.deleteReview(id),
    [["reviews"], ["threads"], ["leaderboard"]],
  );
}
