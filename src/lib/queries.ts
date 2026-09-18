// React Query hooks. One hook per data domain. Mutations write the optimistic
// value to the cache first (so votes/bars update instantly), then reconcile by
// invalidating on settle. On error the optimistic value is rolled back.

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, requireSupabase } from "./supabase";
import { MOCK_USER } from "./mock";
import { getSession, setSession, useSession } from "./session";
import { fetchProfile } from "./api";
import * as api from "./api";
import type { Vault, VaultTab, Reply, Review, ReviewTag, Notification, Movie, Announcement, Profile, Screening, MovieRating } from "./types";

export { useSession };

// ─── Auth bootstrap ───────────────────────────────────────────────────────────
export function useInitAuth() {
  const qc = useQueryClient();
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }
    const sb = requireSupabase();
    let active = true;
    const apply = (userId: string | undefined, email?: string | null) => {
      if (!userId) {
        setSession(null);
        qc.clear();
        return;
      }
      fetchProfile(userId).then((profile) => {
        if (active) setSession(profile ? { user: { ...profile, email: email ?? null } } : null);
      });
    };
    // Restore a persisted session on load / new tab. The INITIAL_SESSION event
    // from onAuthStateChange can fire with a null session before the client
    // finishes recovering from storage, so getSession() is the authoritative
    // restore path.
    sb.auth.getSession().then(({ data }) => {
      if (active) apply(data.session?.user?.id, data.session?.user?.email);
    });
    // Track live auth changes (sign in, sign out, token refresh).
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_OUT") {
        // Token refresh can emit a transient SIGNED_OUT; only clear when the
        // session is actually gone.
        sb.auth.getSession().then(({ data }) => {
          if (active && !data.session) apply(undefined);
        });
        return;
      }
      apply(s?.user?.id, s?.user?.email);
    });
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
    sendSignupCode: (email: string) => api.sendSignupCode(email),
    verifySignup: (email: string, password: string, username: string, code: string) =>
      api.verifySignup(email, password, username, code),
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

export function useDeletedMovies(enabled = true) {
  return useQuery({ queryKey: ["deletedMovies"], queryFn: api.listDeletedMovies, enabled });
}

export function useReviews() {
  return useQuery({ queryKey: ["reviews"], queryFn: api.listReviews });
}

export function useMovieRatings() {
  return useQuery({ queryKey: ["movieRatings"], queryFn: api.listMovieRatings });
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

export function useLeaderboard(enabled = true) {
  return useQuery({ queryKey: ["leaderboard"], queryFn: api.getLeaderboard, enabled });
}

export function useMembers(enabled = true) {
  return useQuery({ queryKey: ["members"], queryFn: api.listMembers, enabled });
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

export function useVaultOf(userId: string) {
  return useQuery({ queryKey: ["vault", userId], queryFn: () => api.getVault(userId), enabled: !!userId });
}

export function useFollowingOf(userId: string) {
  return useQuery({ queryKey: ["following", userId], queryFn: () => api.getFollowing(userId), enabled: !!userId });
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

export function useNotifications() {
  const session = useSession();
  const uid = session?.user.id ?? "";
  return useQuery({ queryKey: ["notifications", uid], queryFn: () => api.listNotifications(), enabled: !!uid });
}

export function useAnnouncements() {
  return useQuery({ queryKey: ["announcements"], queryFn: api.listAnnouncements });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
type Rollback = () => void;

/** Optimistically overwrite a cache value; returns a rollback restoring the old one. */
function patch<T>(qc: QueryClient, key: unknown[], updater: (old: T) => T): Rollback {
  const old = qc.getQueryData<T>(key);
  if (old === undefined) return () => {};
  qc.setQueryData<T>(key, updater(old));
  return () => qc.setQueryData(key, old);
}

function useOptimisticMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  keys: string[][],
  optimistic?: (args: TArgs, qc: QueryClient) => Rollback | void,
) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TArgs, Rollback | void>({
    mutationFn: fn,
    onMutate: async (args) => {
      if (!optimistic) return;
      await Promise.all(keys.map((k) => qc.cancelQueries({ queryKey: k })));
      return optimistic(args, qc);
    },
    onError: (_err, _args, ctx) => {
      if (ctx) ctx();
    },
    onSettled: () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k })),
  });
}

export function useCreateReview() {
  return useOptimisticMutation(api.createReview, [["reviews"], ["leaderboard"]], (input, qc) => {
    const uid = getSession()?.user.id ?? "";
    const username = getSession()?.user.username ?? "You";
    return patch<Review[]>(qc, ["reviews"], (old) => {
      const review: Review = {
        id: `tmp-${Date.now()}`, movie_id: input.movie_id, author_id: uid,
        username, rating: input.rating, body: input.body, tags: input.tags,
        upvotes: 0, downvotes: 0, created_at: new Date().toISOString(), featured: false,
      };
      return [review, ...old];
    });
  });
}

export function useVoteReview() {
  return useOptimisticMutation(
    (args: { id: string; dir: "up" | "down" }) => api.voteReview(args.id, args.dir),
    [["reviews"], ["myReviewVotes"], ["leaderboard"]],
    (args, qc) => {
      const uid = getSession()?.user.id ?? "";
      // Base review tallies exclude the current user's vote; the UI layers it on
      // from this map, so only `myReviewVotes` needs the optimistic write.
      return patch<Record<string, "up" | "down" | null>>(qc, ["myReviewVotes", uid], (old) => {
        const cur = old[args.id] ?? null;
        const next = cur === args.dir ? null : args.dir;
        return { ...old, [args.id]: next };
      });
    },
  );
}

export function useAddReply() {
  return useOptimisticMutation(
    (args: { reviewId: string; body: string }) => api.addReply(args.reviewId, args.body),
    [["threads"]],
    (args, qc) => {
      const username = getSession()?.user.username ?? "You";
      return patch<Record<string, Reply[]>>(qc, ["threads"], (old) => {
        const list = old[args.reviewId] ?? [];
        const reply: Reply = {
          id: `tmp-${Date.now()}`, review_id: args.reviewId, username, body: args.body, created_at: new Date().toISOString(),
        };
        return { ...old, [args.reviewId]: [...list, reply] };
      });
    },
  );
}

export function useCastPollVote() {
  return useOptimisticMutation(
    (args: { pollId: string; optionIndex: number; multiple: boolean }) =>
      api.castPollVote(args.pollId, args.optionIndex, args.multiple),
    [["polls"], ["myPollVotes"]],
    (args, qc) => {
      const uid = getSession()?.user.id ?? "";
      return patch<Record<string, number[]>>(qc, ["myPollVotes", uid], (old) => {
        const cur = old[args.pollId] ?? [];
        const next = args.multiple
          ? cur.includes(args.optionIndex)
            ? cur.filter((i) => i !== args.optionIndex)
            : [...cur, args.optionIndex]
          : [args.optionIndex];
        return { ...old, [args.pollId]: next };
      });
    },
  );
}

export function useToggleFavorite() {
  return useOptimisticMutation((id: string) => api.toggleFavorite(id), [["vault"]], (movieId, qc) => {
    const uid = getSession()?.user.id ?? "";
    return patch<Vault>(qc, ["vault", uid], (old) => {
      const has = old.favorites.includes(movieId);
      return { ...old, favorites: has ? old.favorites.filter((x) => x !== movieId) : [...old.favorites, movieId] };
    });
  });
}

export function useSetVaultStatus() {
  return useOptimisticMutation(
    (args: { movieId: string; status: VaultTab }) => api.setVaultStatus(args.movieId, args.status),
    [["vault"]],
    (args, qc) => {
      const uid = getSession()?.user.id ?? "";
      return patch<Vault>(qc, ["vault", uid], (old) => {
        const has = old[args.status].includes(args.movieId);
        return { ...old, [args.status]: has ? old[args.status].filter((x) => x !== args.movieId) : [...old[args.status], args.movieId] };
      });
    },
  );
}

export function useRateMovie() {
  return useOptimisticMutation(
    (args: { movieId: string; rating: number }) => api.rateMovie(args.movieId, args.rating),
    [["movieRatings"]],
    (args, qc) => {
      const uid = getSession()?.user.id ?? "";
      return patch<MovieRating[]>(qc, ["movieRatings"], (old) => {
        const existing = old.find((r) => r.movie_id === args.movieId && r.user_id === uid);
        if (existing) {
          return old.map((r) => (r === existing ? { ...r, rating: args.rating } : r));
        }
        return [...old, { id: `tmp-${Date.now()}`, movie_id: args.movieId, user_id: uid, rating: args.rating }];
      });
    },
  );
}

export function useToggleFollow() {
  return useOptimisticMutation((id: string) => api.toggleFollow(id), [["following"]], (targetId, qc) => {
    const uid = getSession()?.user.id ?? "";
    return patch<string[]>(qc, ["following", uid], (old) =>
      old.includes(targetId) ? old.filter((x) => x !== targetId) : [...old, targetId]);
  });
}

export function useAddScreening() {
  return useOptimisticMutation(
    (args: Omit<import("./types").Screening, "id">) => api.addScreening(args),
    [["screenings"]],
  );
}

export function useDeleteScreening() {
  return useOptimisticMutation((id: string) => api.deleteScreening(id), [["screenings"]]);
}

export function useToggleScreeningFeatured() {
  return useOptimisticMutation(
    (id: string) => api.toggleScreeningFeatured(id),
    [["screenings"]],
    (id, qc) =>
      patch<Screening[]>(qc, ["screenings"], (old) =>
        old.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s)),
      ),
  );
}

export function useAddPoll() {
  return useOptimisticMutation(
    (args: { question: string; closes: string; options: string[]; multiple: boolean }) => api.addPoll(args),
    [["polls"]],
  );
}

export function useTogglePoll() {
  return useOptimisticMutation((id: string) => api.togglePoll(id), [["polls"]]);
}

export function useDeletePoll() {
  return useOptimisticMutation((id: string) => api.deletePoll(id), [["polls"]]);
}

export function useDeleteReview() {
  return useOptimisticMutation(
    (id: string) => api.deleteReview(id),
    [["reviews"], ["threads"], ["leaderboard"]],
  );
}

export function useUpdateReview() {
  return useOptimisticMutation(
    (args: { id: string; movie_id: string; rating: number; body: string; tags: ReviewTag[] }) =>
      api.updateReview(args.id, { movie_id: args.movie_id, rating: args.rating, body: args.body, tags: args.tags }),
    [["reviews"], ["leaderboard"]],
    (args, qc) =>
      patch<Review[]>(qc, ["reviews"], (old) =>
        old.map((r) => (r.id === args.id ? { ...r, rating: args.rating, body: args.body, tags: args.tags } : r)),
      ),
  );
}

export function useMarkNotificationsRead() {
  return useOptimisticMutation(
    () => api.markNotificationsRead(),
    [["notifications"]],
    (_args, qc) => {
      const uid = getSession()?.user.id ?? "";
      return patch<Notification[]>(qc, ["notifications", uid], (old) =>
        old.map((n) => (n.read ? n : { ...n, read: true })));
    },
  );
}

export function useAddMovie() {
  return useOptimisticMutation(
    (args: { title: string; year: number; genre: string; rating: number; director: string; poster: string }) => api.addMovie(args),
    [["movies"]],
    (args, qc) => patch<Movie[]>(qc, ["movies"], (old) => [{ id: `tmp-${Date.now()}`, ...args }, ...old]),
  );
}

export function useDeleteMovie() {
  return useOptimisticMutation(
    (id: string) => api.deleteMovie(id),
    [["movies"], ["deletedMovies"], ["vault"], ["reviews"], ["leaderboard"]],
    (id, qc) => patch<Movie[]>(qc, ["movies"], (old) => old.filter((m) => m.id !== id)),
  );
}

export function useRestoreMovie() {
  return useOptimisticMutation(
    (id: string) => api.restoreMovie(id),
    [["movies"], ["deletedMovies"]],
  );
}

export function useDeleteComment() {
  return useOptimisticMutation(
    (id: string) => api.deleteComment(id),
    [["threads"]],
    (id, qc) => patch<Record<string, Reply[]>>(qc, ["threads"], (old) => {
      const next: Record<string, Reply[]> = {};
      for (const k of Object.keys(old)) next[k] = old[k].filter((c) => c.id !== id);
      return next;
    }),
  );
}

export function useAddAnnouncement() {
  return useOptimisticMutation(
    (args: { title: string; body: string }) => api.addAnnouncement(args),
    [["announcements"]],
    (args, qc) => {
      const username = getSession()?.user.username ?? "You";
      return patch<Announcement[]>(qc, ["announcements"], (old) => [
        { id: `tmp-${Date.now()}`, title: args.title, body: args.body, author: username, created_at: new Date().toISOString() },
        ...old,
      ]);
    },
  );
}

export function useDeleteAnnouncement() {
  return useOptimisticMutation((id: string) => api.deleteAnnouncement(id), [["announcements"]]);
}

export function useSetMemberRole() {
  return useOptimisticMutation(
    (args: { userId: string; role: "member" | "admin" }) => api.setMemberRole(args.userId, args.role),
    [["members"]],
    (args, qc) => patch<Profile[]>(qc, ["members"], (old) =>
      old.map((m) => (m.id === args.userId ? { ...m, role: args.role } : m))),
  );
}

export function useSetReviewFeatured() {
  return useOptimisticMutation(
    (args: { reviewId: string; featured: boolean; backgroundUrl?: string }) => api.setReviewFeatured(args.reviewId, args.featured, args.backgroundUrl),
    [["reviews"]],
    (args, qc) => patch<Review[]>(qc, ["reviews"], (old) =>
      old.map((r) => (r.id === args.reviewId ? { ...r, featured: args.featured, background_url: args.backgroundUrl } : r))),
  );
}

export function useUpdateUsername() {
  return useOptimisticMutation(
    (username: string) => api.updateUsername(username),
    [["members"]],
  );
}

export function useDeleteAccount() {
  return useOptimisticMutation(
    (userId: string) => api.deleteAccount(userId),
    [["members"]],
    (userId, qc) => patch<Profile[]>(qc, ["members"], (old) => old.filter((m) => m.id !== userId)),
  );
}
