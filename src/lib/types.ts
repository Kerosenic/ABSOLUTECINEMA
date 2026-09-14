// Shared client types. These are the shapes the UI renders, regardless of
// whether the data comes from Supabase (real backend) or the mock store.

export type Role = "member" | "admin";

export interface Profile {
  id: string;
  username: string;
  role: Role;
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
}

export interface Review {
  id: string;
  movie_id: string;
  author_id: string;
  username: string;
  rating: number;
  body: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface Reply {
  id: string;
  review_id: string;
  username: string;
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
}

export type VaultTab = "watched" | "plantowatch" | "favorites";

export type Vault = Record<VaultTab, string[]>;

export interface LeaderboardRow {
  username: string;
  reviews: number;
  upvotes: number;
}
