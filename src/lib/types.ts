// Shared client types. These are the shapes the UI renders, regardless of
// whether the data comes from Supabase (real backend) or the mock store.

export type Role = "member" | "admin";

export interface Profile {
  id: string;
  username: string;
  role: Role;
  avatar_url?: string | null;
  email?: string | null;
}

export interface Session {
  user: Profile;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  genre: string;
  rating: number;
  director: string;
  poster: string;
  deleted_at?: string | null;
}

export interface MovieRating {
  id: string;
  movie_id: string;
  user_id: string;
  rating: number;
}

export const REVIEW_TAGS = ["comment", "review", "analysis", "spoiler"] as const;

export type ReviewTag = (typeof REVIEW_TAGS)[number];

export interface Review {
  id: string;
  movie_id: string;
  author_id: string;
  username: string;
  avatar_url?: string | null;
  rating: number;
  body: string;
  tags: ReviewTag[];
  upvotes: number;
  downvotes: number;
  created_at: string;
  featured: boolean;
  background_url?: string | null;
}

export interface Reply {
  id: string;
  review_id: string;
  username: string;
  avatar_url?: string | null;
  body: string;
  created_at: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  closes: string;
  status: "open" | "closed";
  options: PollOption[];
}

export interface Screening {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  poster?: string;
  movie_id?: string | null;
  featured?: boolean;
}

export type VaultTab = "watched" | "plantowatch" | "favorites";

export type Vault = Record<VaultTab, string[]>;

export interface LeaderboardRow {
  username: string;
  reviews: number;
  upvotes: number;
}

export interface Notification {
  id: string;
  type: string;
  body: string;
  link?: string | null;
  read: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  created_at: string;
}
