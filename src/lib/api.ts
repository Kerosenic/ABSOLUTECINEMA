// Data-access facade. Every function dispatches to Supabase when configured,
// otherwise to the mock store. The UI never touches Supabase or localStorage
// directly — it only calls these functions (through lib/queries.ts).

import { isSupabaseConfigured, requireSupabase } from "./supabase";
import type {
  Movie, Review, Reply, Poll, Screening, Vault, VaultTab, LeaderboardRow, Profile, Session, Notification, Announcement,
} from "./types";
import {
  MOCK_USER, LEADERBOARD,
  mockMovies, mockReviews, mockThreads, mockUserVotes, mockPolls, mockPollVotes,
  mockScreenings, mockVault, mockFollowing, mockNotifications, mockMarkNotificationsRead,
  mockVoteReview, mockAddReply, mockCreateReview, mockCastPollVote,
  mockToggleFavorite, mockSetVaultStatus, mockToggleFollow,
  mockAddScreening, mockDeleteScreening, mockToggleScreeningFeatured, mockAddPoll, mockTogglePoll, mockDeletePoll, mockDeleteReview,
  mockAddMovie, mockDeleteMovie, mockRestoreMovie, mockDeleteComment,
  mockMembers, mockSetMemberRole, mockAnnouncements, mockAddAnnouncement, mockDeleteAnnouncement,
  mockSetReviewFeatured, mockUpdateUsername,
} from "./mock";

function to12h(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Session / auth ───────────────────────────────────────────────────────────
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const sb = requireSupabase();
  const { data } = await sb.from("profiles").select("id, username, role, avatar_url").eq("id", userId).maybeSingle();
  if (!data) return null;
  return { id: data.id, username: data.username, role: data.role, avatar_url: data.avatar_url ?? null };
}

export async function signInEmail(email: string, password: string): Promise<Session | null> {
  if (!isSupabaseConfigured) return { user: MOCK_USER };
  const sb = requireSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = data.user ? await fetchProfile(data.user.id) : null;
  return profile ? { user: { ...profile, email: data.user?.email ?? null } } : null;
}

const ADMIN_EMAIL = "firelight7831@gmail.com";

export function isAdminSignupEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

function assertTsinglan(email: string): void {
  const domain = email.split("@")[1]?.toLowerCase();
  if (domain !== "tsinglan.org" && !isAdminSignupEmail(email)) {
    throw new Error("Sign up is restricted to @tsinglan.org email addresses");
  }
}

/** Invoke an Edge Function and surface its JSON `error` as a thrown Error. */
async function invoke(name: string, body: Record<string, unknown>): Promise<any> {
  const sb = requireSupabase();
  const { data, error } = await sb.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    let msg = "Request failed";
    try {
      const ctx = await (error as any).context?.json();
      msg = ctx?.error || msg;
    } catch {
      /* no JSON context */
    }
    throw new Error(msg);
  }
  return data;
}

export async function sendSignupCode(email: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  assertTsinglan(email);
  await invoke("send-code", { email });
}

export async function verifySignup(email: string, password: string, username: string, code: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  assertTsinglan(email);
  await invoke("verify-signup", { email, password, username, code });
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured) await requireSupabase().auth.signOut();
}

// ─── Reads ────────────────────────────────────────────────────────────────────
export async function listMovies(): Promise<Movie[]> {
  if (!isSupabaseConfigured) return mockMovies().filter((m) => !m.deleted_at);
  const sb = requireSupabase();
  const { data } = await sb.from("movies").select("*").is("deleted_at", null).order("year", { ascending: false });
  return (data ?? []).map((m: any) => ({
    id: m.id, title: m.title, year: m.year, genre: m.genre,
    rating: Number(m.rating), director: m.director, poster: m.poster_url,
  }));
}

export async function listDeletedMovies(): Promise<Movie[]> {
  if (!isSupabaseConfigured) return mockMovies().filter((m) => m.deleted_at);
  const sb = requireSupabase();
  const { data } = await sb.from("movies").select("*").not("deleted_at", "is", null).order("deleted_at", { ascending: false });
  return (data ?? []).map((m: any) => ({
    id: m.id, title: m.title, year: m.year, genre: m.genre,
    rating: Number(m.rating), director: m.director, poster: m.poster_url, deleted_at: m.deleted_at,
  }));
}

export async function listReviews(): Promise<Review[]> {
  if (!isSupabaseConfigured) return mockReviews();
  const sb = requireSupabase();
  const uid = await currentUserId();
  const [{ data: reviews }, { data: profiles }, { data: votes }] = await Promise.all([
    sb.from("reviews").select("*").order("created_at", { ascending: false }),
    sb.from("profiles").select("id, username"),
    sb.from("review_votes").select("review_id, direction, user_id"),
  ]);
  const username = new Map<string, string>((profiles ?? []).map((p: any) => [p.id, p.username]));
  const tally = new Map<string, { up: number; down: number }>();
  for (const v of votes ?? []) {
    if (uid && v.user_id === uid) continue; // own vote is layered on via myReviewVotes
    const t = tally.get(v.review_id) ?? { up: 0, down: 0 };
    if (v.direction === 1) t.up += 1; else t.down += 1;
    tally.set(v.review_id, t);
  }
  return (reviews ?? []).map((r: any) => ({
    id: r.id, movie_id: r.movie_id, author_id: r.author_id,
    username: username.get(r.author_id) ?? "Member",
    rating: r.rating, body: r.body, created_at: r.created_at,
    upvotes: tally.get(r.id)?.up ?? 0, downvotes: tally.get(r.id)?.down ?? 0,
    featured: r.featured ?? false,
  }));
}

export async function listThreads(): Promise<Record<string, Reply[]>> {
  if (!isSupabaseConfigured) return mockThreads();
  const sb = requireSupabase();
  const [{ data: comments }, { data: profiles }] = await Promise.all([
    sb.from("comments").select("*").order("created_at", { ascending: true }),
    sb.from("profiles").select("id, username"),
  ]);
  const username = new Map<string, string>((profiles ?? []).map((p: any) => [p.id, p.username]));
  const out: Record<string, Reply[]> = {};
  for (const c of comments ?? []) {
    (out[c.review_id] ??= []).push({
      id: c.id, review_id: c.review_id,
      username: username.get(c.author_id) ?? "Member", body: c.body, created_at: c.created_at,
    });
  }
  return out;
}

export async function listPolls(): Promise<Poll[]> {
  if (!isSupabaseConfigured) return mockPolls();
  const sb = requireSupabase();
  const uid = await currentUserId();
  const [{ data: polls }, { data: options }, { data: votes }] = await Promise.all([
    sb.from("polls").select("*").order("created_at", { ascending: false }),
    sb.from("poll_options").select("*").order("position", { ascending: true }),
    sb.from("poll_votes").select("option_id, user_id"),
  ]);
  const tally = new Map<string, number>();
  for (const v of votes ?? []) {
    if (uid && v.user_id === uid) continue; // own vote is layered on via myPollVotes
    tally.set(v.option_id, (tally.get(v.option_id) ?? 0) + 1);
  }
  return (polls ?? []).map((p: any) => ({
    id: p.id,
    question: p.title,
    closes: p.expires_at ? p.expires_at.slice(0, 10) : "TBD",
    status: p.status === "open" ? "open" : "closed",
    options: (options ?? []).filter((o: any) => o.poll_id === p.id)
      .map((o: any) => ({ id: o.id, label: o.title, votes: tally.get(o.id) ?? 0 })),
  }));
}

export async function listScreenings(): Promise<Screening[]> {
  if (!isSupabaseConfigured) return mockScreenings();
  const sb = requireSupabase();
  const { data } = await sb.from("screenings").select("*").order("date", { ascending: true });
  return (data ?? []).map((s: any) => ({
    id: s.id, title: s.title, date: s.date, time: to12h(s.time), location: s.location,
    movie_id: s.movie_id || null, featured: s.featured || false, poster: s.poster_url || undefined,
  }));
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured) return LEADERBOARD;
  const sb = requireSupabase();
  const { data } = await sb.rpc("get_leaderboard");
  return (data ?? []).map((r: any) => ({ username: r.username, reviews: Number(r.reviews), upvotes: Number(r.upvotes) }));
}

export async function listMembers(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return mockMembers();
  const sb = requireSupabase();
  const { data } = await sb.from("profiles").select("id, username, role").order("username");
  return (data ?? []).map((p: any) => ({ id: p.id, username: p.username, role: p.role }));
}

export async function getVault(userId: string): Promise<Vault> {
  if (!isSupabaseConfigured) return mockVault();
  const sb = requireSupabase();
  const { data } = await sb.from("library_entries").select("movie_id, status").eq("user_id", userId);
  const vault: Vault = { watched: [], plantowatch: [], favorites: [] };
  for (const e of data ?? []) {
    if (e.status === "watched") vault.watched.push(e.movie_id);
    else if (e.status === "plan_to_watch") vault.plantowatch.push(e.movie_id);
    else if (e.status === "favorite") vault.favorites.push(e.movie_id);
  }
  return vault;
}

export async function getFollowing(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) return mockFollowing();
  const sb = requireSupabase();
  const { data } = await sb.from("friendships").select("addressee_id").eq("requester_id", userId).eq("status", "accepted");
  return (data ?? []).map((f: any) => f.addressee_id);
}

export async function getMyReviewVotes(userId: string): Promise<Record<string, "up" | "down" | null>> {
  if (!isSupabaseConfigured) return mockUserVotes();
  const sb = requireSupabase();
  const { data } = await sb.from("review_votes").select("review_id, direction").eq("user_id", userId);
  const out: Record<string, "up" | "down" | null> = {};
  for (const v of data ?? []) out[v.review_id] = v.direction === 1 ? "up" : "down";
  return out;
}

export async function getMyPollVotes(userId: string): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return mockPollVotes();
  const sb = requireSupabase();
  const [{ data: votes }, { data: options }] = await Promise.all([
    sb.from("poll_votes").select("poll_id, option_id").eq("user_id", userId),
    sb.from("poll_options").select("id, poll_id, position").order("position", { ascending: true }),
  ]);
  const byPoll: Record<string, string[]> = {};
  for (const o of options ?? []) (byPoll[o.poll_id] ??= []).push(o.id);
  const out: Record<string, number> = {};
  for (const v of votes ?? []) {
    const idx = (byPoll[v.poll_id] ?? []).indexOf(v.option_id);
    if (idx >= 0) out[v.poll_id] = idx;
  }
  return out;
}

export async function listNotifications(): Promise<Notification[]> {
  if (!isSupabaseConfigured) return mockNotifications();
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return [];
  const { data } = await sb.from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(30);
  return (data ?? []).map((n: any) => ({
    id: n.id, type: n.type, body: n.body, link: n.link ?? null, read: n.read, created_at: n.created_at,
  }));
}

export async function listAnnouncements(): Promise<Announcement[]> {
  if (!isSupabaseConfigured) return mockAnnouncements();
  const sb = requireSupabase();
  const [{ data: anns }, { data: profiles }] = await Promise.all([
    sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(20),
    sb.from("profiles").select("id, username"),
  ]);
  const username = new Map<string, string>((profiles ?? []).map((p: any) => [p.id, p.username]));
  return (anns ?? []).map((a: any) => ({
    id: a.id, title: a.title, body: a.body,
    author: username.get(a.author_id) ?? "Admin", created_at: a.created_at,
  }));
}

// ─── Mutations ────────────────────────────────────────────────────────────────
async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return MOCK_USER.id;
  const { data } = await requireSupabase().auth.getUser();
  return data.user?.id ?? null;
}

export async function createReview(input: { movie_id: string; rating: number; body: string }): Promise<Review> {
  if (!isSupabaseConfigured) return mockCreateReview(input);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) throw new Error("Sign in to write a review");
  const { data: movie } = await sb.from("movies").select("*").eq("id", input.movie_id).maybeSingle();
  await sb.from("reviews").insert({
    author_id: uid, movie_id: input.movie_id,
    title: movie?.title ?? "", poster_url: movie?.poster_url ?? null,
    rating: input.rating, body: input.body,
  });
  const profile = await fetchProfile(uid);
  return {
    id: "", movie_id: input.movie_id, author_id: uid,
    username: profile?.username ?? "Member", rating: input.rating, body: input.body,
    upvotes: 0, downvotes: 0, created_at: new Date().toISOString(), featured: false,
  };
}

export async function voteReview(reviewId: string, dir: "up" | "down"): Promise<void> {
  if (!isSupabaseConfigured) return mockVoteReview(reviewId, dir);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  const direction = dir === "up" ? 1 : -1;
  const { data: existing } = await sb.from("review_votes")
    .select("id, direction").eq("review_id", reviewId).eq("user_id", uid).maybeSingle();
  if (existing) {
    if (existing.direction === direction) {
      await sb.from("review_votes").delete().eq("id", existing.id);
    } else {
      await sb.from("review_votes").update({ direction }).eq("id", existing.id);
    }
  } else {
    await sb.from("review_votes").insert({ review_id: reviewId, user_id: uid, direction });
  }
}

export async function addReply(reviewId: string, body: string): Promise<void> {
  if (!isSupabaseConfigured) return mockAddReply(reviewId, body);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  await sb.from("comments").insert({ review_id: reviewId, author_id: uid, body });
}

export async function castPollVote(pollId: string, optionIndex: number): Promise<void> {
  if (!isSupabaseConfigured) return mockCastPollVote(pollId, optionIndex);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  const { data: options } = await sb.from("poll_options")
    .select("id").eq("poll_id", pollId).order("position", { ascending: true });
  const option = (options ?? [])[optionIndex];
  if (!option) return;
  await sb.from("poll_votes")
    .upsert({ poll_id: pollId, option_id: option.id, user_id: uid }, { onConflict: "poll_id,user_id" });
}

export async function toggleFavorite(movieId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockToggleFavorite(movieId);
  await toggleLibraryEntry(movieId, "favorite");
}

export async function setVaultStatus(movieId: string, status: VaultTab): Promise<void> {
  if (!isSupabaseConfigured) return mockSetVaultStatus(movieId, status);
  await toggleLibraryEntry(movieId, status);
}

async function toggleLibraryEntry(movieId: string, status: string): Promise<void> {
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  const { data: movie } = await sb.from("movies").select("*").eq("id", movieId).maybeSingle();
  const { data: existing } = await sb.from("library_entries")
    .select("id").eq("user_id", uid).eq("movie_id", movieId).eq("status", status).maybeSingle();
  if (existing) {
    await sb.from("library_entries").delete().eq("id", existing.id);
  } else {
    await sb.from("library_entries").insert({
      user_id: uid, movie_id: movieId, title: movie?.title ?? "", poster_url: movie?.poster_url ?? null, status,
    });
  }
}

export async function toggleFollow(targetId: string): Promise<void> {
  if (!isSupabaseConfigured) return mockToggleFollow(targetId);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid || uid === targetId) return;
  const { data: existing } = await sb.from("friendships")
    .select("id").eq("requester_id", uid).eq("addressee_id", targetId).maybeSingle();
  if (existing) {
    await sb.from("friendships").delete().eq("id", existing.id);
  } else {
    await sb.from("friendships").insert({ requester_id: uid, addressee_id: targetId, status: "accepted" });
  }
}

export async function addScreening(input: Omit<Screening, "id">): Promise<void> {
  if (!isSupabaseConfigured) { mockAddScreening(input); return; }
  const sb = requireSupabase();
  await sb.from("screenings").insert({
    title: input.title, date: input.date, time: input.time, location: input.location,
    movie_id: input.movie_id || null, featured: input.featured || false, poster_url: input.poster || null,
  });
}

export async function deleteScreening(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeleteScreening(id); return; }
  await requireSupabase().from("screenings").delete().eq("id", id);
}

export async function toggleScreeningFeatured(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockToggleScreeningFeatured(id); return; }
  const sb = requireSupabase();
  const { data } = await sb.from("screenings").select("featured").eq("id", id).maybeSingle();
  await sb.from("screenings").update({ featured: !(data?.featured ?? false) }).eq("id", id);
}

export async function addPoll(input: { question: string; closes: string; options: string[] }): Promise<void> {
  if (!isSupabaseConfigured) { mockAddPoll(input); return; }
  const sb = requireSupabase();
  const uid = await currentUserId();
  const { data: poll } = await sb.from("polls")
    .insert({ title: input.question, status: "open", expires_at: input.closes ? `${input.closes}T23:59:59Z` : null, created_by: uid ?? null })
    .select("id").single();
  if (!poll) throw new Error("Failed to create poll");
  const rows = input.options.map((label, i) => ({ poll_id: poll.id, title: label, position: i }));
  await sb.from("poll_options").insert(rows);
}

export async function togglePoll(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockTogglePoll(id); return; }
  const sb = requireSupabase();
  const { data } = await sb.from("polls").select("status").eq("id", id).maybeSingle();
  if (data) {
    await sb.from("polls").update({ status: data.status === "open" ? "closed" : "open" }).eq("id", id);
  }
}

export async function deletePoll(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeletePoll(id); return; }
  await requireSupabase().from("polls").delete().eq("id", id);
}

export async function deleteReview(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeleteReview(id); return; }
  await requireSupabase().from("reviews").delete().eq("id", id);
}

export async function markNotificationsRead(): Promise<void> {
  if (!isSupabaseConfigured) { mockMarkNotificationsRead(); return; }
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  await sb.from("notifications").update({ read: true }).eq("user_id", uid).eq("read", false);
}

export async function addMovie(input: { title: string; year: number; genre: string; rating: number; director: string; poster: string }): Promise<Movie> {
  if (!isSupabaseConfigured) return mockAddMovie(input);
  const sb = requireSupabase();
  const id = crypto.randomUUID();
  await sb.from("movies").insert({
    id, title: input.title, year: input.year, genre: input.genre,
    rating: input.rating, director: input.director, poster_url: input.poster || null,
  });
  return { id, ...input };
}

export async function deleteMovie(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeleteMovie(id); return; }
  await requireSupabase().from("movies").update({ deleted_at: new Date().toISOString() }).eq("id", id);
}

export async function restoreMovie(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockRestoreMovie(id); return; }
  await requireSupabase().from("movies").update({ deleted_at: null }).eq("id", id);
}

export async function deleteComment(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeleteComment(id); return; }
  await requireSupabase().from("comments").delete().eq("id", id);
}

export async function addAnnouncement(input: { title: string; body: string }): Promise<Announcement> {
  if (!isSupabaseConfigured) return mockAddAnnouncement(input);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) throw new Error("Sign in to post an announcement");
  await sb.from("announcements").insert({ author_id: uid, title: input.title, body: input.body });
  const profile = await fetchProfile(uid);
  return { id: "", title: input.title, body: input.body, author: profile?.username ?? "Admin", created_at: new Date().toISOString() };
}

export async function deleteAnnouncement(id: string): Promise<void> {
  if (!isSupabaseConfigured) { mockDeleteAnnouncement(id); return; }
  await requireSupabase().from("announcements").delete().eq("id", id);
}

export async function setMemberRole(userId: string, role: "member" | "admin"): Promise<void> {
  if (!isSupabaseConfigured) { mockSetMemberRole(userId, role); return; }
  await requireSupabase().from("profiles").update({ role }).eq("id", userId);
}

export async function setReviewFeatured(reviewId: string, featured: boolean, backgroundUrl?: string): Promise<void> {
  if (!isSupabaseConfigured) { mockSetReviewFeatured(reviewId, featured, backgroundUrl); return; }
  const update: { featured: boolean; background_url?: string } = { featured };
  if (backgroundUrl !== undefined) update.background_url = backgroundUrl;
  await requireSupabase().from("reviews").update(update).eq("id", reviewId);
}

export async function updateUsername(username: string): Promise<void> {
  if (!isSupabaseConfigured) { mockUpdateUsername(username); return; }
  const uid = await currentUserId();
  if (!uid) return;
  await requireSupabase().from("profiles").update({ username }).eq("id", uid);
}

export async function deleteAccount(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Browser client lacks the service-role key for auth.admin.deleteUser and
  // profiles has no DELETE RLS policy, so deletion happens in the delete-user
  // edge function (which verifies the caller is admin).
  await invoke("delete-user", { userId });
}

// ─── Storage ─────────────────────────────────────────────────────────────────
// In mock mode uploads resolve to a local object URL so the UI still previews
// the chosen image; in live mode they hit Supabase Storage and return the
// public URL for that bucket.
export async function uploadPoster(file: File): Promise<string> {
  if (!isSupabaseConfigured) return URL.createObjectURL(file);
  const sb = requireSupabase();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("posters").upload(path, file);
  if (error) throw error;
  const { data } = sb.storage.from("posters").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(file: File): Promise<string> {
  if (!isSupabaseConfigured) return URL.createObjectURL(file);
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) throw new Error("Sign in to upload an avatar");
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from("avatars").upload(path, file);
  if (error) throw error;
  const { data } = sb.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateAvatar(url: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const sb = requireSupabase();
  const uid = await currentUserId();
  if (!uid) return;
  await sb.from("profiles").update({ avatar_url: url }).eq("id", uid);
}
