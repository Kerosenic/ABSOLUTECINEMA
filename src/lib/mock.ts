// Mock backend: seed data + a localStorage store. Used when Supabase is not
// configured, so the prototype keeps working exactly as before.

import type {
  Movie, Review, Reply, Poll, Screening, Vault, VaultTab, LeaderboardRow, Profile,
} from "./types";

export const MOCK_USER: Profile = { id: "u1", username: "CinemaVault", role: "admin" };

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

// ─── Seed data ────────────────────────────────────────────────────────────────
export const MOVIES: Movie[] = [
  { id: "2",  title: "Past Lives",           year: 2023, genre: "Romance",  rating: 8.7, director: "Celine Song",       poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/da/Past_Lives_film_poster.png&w=500" },
  { id: "3",  title: "Dune: Part Two",       year: 2024, genre: "Sci-Fi",   rating: 8.9, director: "Denis Villeneuve",  poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg&w=500" },
  { id: "7",  title: "Conclave",             year: 2024, genre: "Thriller", rating: 8.6, director: "Edward Berger",     poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Conclave_film_poster.jpg&w=500" },
  { id: "11", title: "The Zone of Interest", year: 2023, genre: "Drama",    rating: 9.0, director: "Jonathan Glazer",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/The_Zone_of_Interest_film_poster.jpg&w=500" },
  { id: "12", title: "Fallen Leaves",        year: 2023, genre: "Romance",  rating: 8.5, director: "Aki Kaurismäki",    poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Kuolleet_lehdet_Poster.jpg&w=500" },
  { id: "13", title: "Cabrini",              year: 2024, genre: "Drama",    rating: 7.9, director: "Alejandro Gómez",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a8/Cabrini_Official_Theatrical_Poster_%282024_film%29.jpg&w=500" },
  { id: "15", title: "A Quiet Place: Day 1", year: 2024, genre: "Horror",   rating: 7.6, director: "Michael Sarnoski",  poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/A_Quiet_Place_Day_One_%282024%29_poster.jpg&w=500" },
  { id: "17", title: "Interstellar",          year: 2014, genre: "Sci-Fi",   rating: 9.0, director: "Christopher Nolan", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg&w=500" },
  { id: "18", title: "Inception",             year: 2010, genre: "Sci-Fi",   rating: 8.8, director: "Christopher Nolan", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg&w=500" },
  { id: "19", title: "The Dark Knight",       year: 2008, genre: "Action",   rating: 9.0, director: "Christopher Nolan", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg&w=500" },
  { id: "20", title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "Action", rating: 8.7, director: "Bob Persichetti", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/fa/Spider-Man_Into_the_Spider-Verse_poster.png&w=500" },
  { id: "21", title: "La La Land",            year: 2016, genre: "Romance",  rating: 8.0, director: "Damien Chazelle",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png&w=500" },
  { id: "22", title: "Arrival",               year: 2016, genre: "Sci-Fi",   rating: 8.5, director: "Denis Villeneuve",  poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg&w=500" },
  { id: "23", title: "The Martian",           year: 2015, genre: "Sci-Fi",   rating: 8.2, director: "Ridley Scott",      poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cd/The_Martian_film_poster.jpg&w=500" },
  { id: "24", title: "Knives Out",            year: 2019, genre: "Thriller", rating: 8.1, director: "Rian Johnson",      poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/Knives_Out_poster.jpeg&w=500" },
  { id: "25", title: "Wonka",                 year: 2023, genre: "Fantasy",  rating: 7.6, director: "Paul King",         poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/90/Wonka_2023_film_poster.jpg&w=500" },
  { id: "26", title: "Barbie",                year: 2023, genre: "Fantasy",  rating: 8.0, director: "Greta Gerwig",      poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg&w=500" },
  { id: "27", title: "Coco",                  year: 2017, genre: "Fantasy",  rating: 8.6, director: "Lee Unkrich",       poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/98/Coco_%282017_film%29_poster.jpg&w=500" },
  { id: "28", title: "Top Gun: Maverick",     year: 2022, genre: "Action",   rating: 8.4, director: "Joseph Kosinski",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/13/Top_Gun_Maverick_Poster.jpg&w=500" },
  { id: "29", title: "Dune",                  year: 2021, genre: "Sci-Fi",   rating: 8.3, director: "Denis Villeneuve",  poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg&w=500" },
  { id: "30", title: "Twisters",              year: 2024, genre: "Action",   rating: 7.5, director: "Lee Isaac Chung",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/Twisters_Official_US_Theatrical_Poster.jpg&w=500" },
  { id: "31", title: "Wicked",                year: 2024, genre: "Fantasy",  rating: 7.8, director: "Jon M. Chu",        poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3c/Wicked_%282024_film%29_poster.png&w=500" },
  { id: "32", title: "The Wild Robot",        year: 2024, genre: "Sci-Fi",   rating: 8.3, director: "Chris Sanders",     poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/70/The_Wild_Robot_poster.jpg&w=500" },
  { id: "33", title: "Inside Out 2",          year: 2024, genre: "Fantasy",  rating: 7.6, director: "Kelsey Mann",       poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg&w=500" },
  { id: "34", title: "Moana 2",               year: 2024, genre: "Fantasy",  rating: 7.0, director: "David Derrick Jr.", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/73/Moana_2_poster.jpg&w=500" },
  { id: "35", title: "Godzilla x Kong: The New Empire", year: 2024, genre: "Action", rating: 6.9, director: "Adam Wingard", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg&w=500" },
  { id: "36", title: "Despicable Me 4",       year: 2024, genre: "Fantasy",  rating: 6.3, director: "Chris Renaud",      poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ed/Despicable_Me_4_Theatrical_Release_Poster.jpeg&w=500" },
  { id: "37", title: "Spider-Man: Across the Spider-Verse", year: 2023, genre: "Action", rating: 8.6, director: "Joaquim Dos Santos", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b4/Spider-Man-_Across_the_Spider-Verse_poster.jpg&w=500" },
  { id: "38", title: "The Super Mario Bros. Movie", year: 2023, genre: "Fantasy", rating: 7.1, director: "Aaron Horvath", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/44/The_Super_Mario_Bros._Movie_poster.jpg&w=500" },
  { id: "39", title: "Sonic the Hedgehog 3",  year: 2024, genre: "Action",   rating: 7.1, director: "Jeff Fowler",       poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/07/Sonic3-box-us-225.jpg&w=500" },
  { id: "40", title: "Kingdom of the Planet of the Apes", year: 2024, genre: "Sci-Fi", rating: 7.2, director: "Wes Ball", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cf/Kingdom_of_the_Planet_of_the_Apes_poster.jpg&w=500" },
  { id: "41", title: "The Fall Guy",          year: 2024, genre: "Action",   rating: 7.1, director: "David Leitch",      poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/The_Fall_Guy_%282024%29_poster.jpg&w=500" },
  { id: "42", title: "Beetlejuice Beetlejuice", year: 2024, genre: "Fantasy", rating: 6.8, director: "Tim Burton", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/ba/Beetlejuice_Beetlejuice_poster.jpg&w=500" },
  { id: "43", title: "Elemental",             year: 2023, genre: "Fantasy",  rating: 7.0, director: "Peter Sohn",        poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Elemental_final_poster.jpg&w=500" },
  { id: "44", title: "Teenage Mutant Ninja Turtles: Mutant Mayhem", year: 2023, genre: "Action", rating: 7.3, director: "Jeff Rowe", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ea/Teenage_Mutant_Ninja_Turtles_-_Mutant_Mayhem.jpg&w=500" },
  { id: "45", title: "Guardians of the Galaxy Vol. 3", year: 2023, genre: "Action", rating: 7.9, director: "James Gunn", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/74/Guardians_of_the_Galaxy_Vol._3_poster.jpg&w=500" },
  { id: "46", title: "The Batman",            year: 2022, genre: "Action",   rating: 7.8, director: "Matt Reeves",       poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/ff/The_Batman_%28film%29_poster.jpg&w=500" },
  { id: "47", title: "Avatar: The Way of Water", year: 2022, genre: "Sci-Fi", rating: 7.6, director: "James Cameron", poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg&w=500" },
  { id: "48", title: "Migration",             year: 2023, genre: "Fantasy",  rating: 6.7, director: "Benjamin Renner",   poster: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cb/Migration_%282023_film%29.jpg&w=500" },
];

export const TRENDING_IDS = ["33", "3", "37", "28", "11", "46"];
export const NEW_RELEASE_IDS = ["33", "34", "35", "3", "7", "15", "39", "40"];

export const GENRES = ["All", "Drama", "Sci-Fi", "Romance", "Thriller", "Horror", "Fantasy", "Action"];
export const YEARS = ["All", "2024", "2023", "2022", "2010s", "2000s", "Pre-2000"];
export const RATINGS = ["All", "9+", "8+", "7+"];

export const REVIEWS: Review[] = [
  { id: "r1", movie_id: "33", author_id: "u1", username: "CinemaVault",     rating: 9,  upvotes: 142, downvotes: 8,  created_at: daysAgo(2),  body: "Pixar back in peak form. Anxiety as the villain is the most honest depiction of growing up since Toy Story. The panic-attack sequence is unforgettable." },
  { id: "r2", movie_id: "2", author_id: "u2", username: "FilmNoir88",       rating: 9,  upvotes: 98,  downvotes: 4,  created_at: daysAgo(4),  body: "A quiet devastation. Past Lives understands longing better than almost any film in recent memory. Greta Lee is a force of nature." },
  { id: "r3", movie_id: "3", author_id: "u3", username: "ReelTalk",         rating: 8,  upvotes: 211, downvotes: 31, created_at: daysAgo(7),  body: "Villeneuve delivers a visually staggering epic. The sandworm sequences are the most awe-inspiring spectacle in years. Zendaya earns every second." },
  { id: "r4", movie_id: "37", author_id: "u4", username: "SunsetBoulevard",  rating: 10, upvotes: 187, downvotes: 6,  created_at: daysAgo(7),  body: "The most visually audacious animated film ever made. Every frame is a painting — Gwen's opening sequence alone is worth the price of admission." },
  { id: "r5", movie_id: "46", author_id: "u5", username: "NewWaveNick",      rating: 8,  upvotes: 76,  downvotes: 19, created_at: daysAgo(14), body: "A grim, rain-soaked detective story that finally treats Batman like a noir protagonist. Pattinson and Kravitz crackle in every scene." },
  { id: "r6", movie_id: "28", author_id: "u6", username: "OscarBait",        rating: 9,  upvotes: 130, downvotes: 11, created_at: daysAgo(21), body: "Pure blockbuster adrenaline with a beating heart. The final-act flight sequences are the best aerial action committed to film in years." },
];

export const REPLY_THREADS: Record<string, Reply[]> = {
  r1: [
    { id: "c1", review_id: "r1", username: "KubrickFan",    body: "The emotion-island aging gag had me in tears. Pixar still has it.", created_at: daysAgo(1) },
    { id: "c2", review_id: "r1", username: "ParallelLines", body: "Anxiety was genuinely terrifying — and painfully real.", created_at: daysAgo(1) },
  ],
  r2: [
    { id: "c3", review_id: "r2", username: "VHSNostalgia", body: "The ending wrecked me. Celine Song is the real deal.", created_at: daysAgo(3) },
  ],
  r3: [
    { id: "c4", review_id: "r3", username: "Mise_en_scene", body: "I've watched the Harkonnen arrival three times. It's flawless.", created_at: daysAgo(5) },
    { id: "c5", review_id: "r3", username: "KubrickFan",    body: "Hans Zimmer deserved the Oscar for this score, full stop.", created_at: daysAgo(4) },
  ],
  r4: [
    { id: "c6", review_id: "r4", username: "FilmNoir88", body: "The Spot might be the best-animated villain in a decade.", created_at: daysAgo(6) },
  ],
  r5: [
    { id: "c7", review_id: "r5", username: "ReelTalk", body: "The Batmobile chase is up there with the best chase scenes ever filmed.", created_at: daysAgo(18) },
  ],
  r6: [
    { id: "c8", review_id: "r6", username: "Mise_en_scene", body: "The training montages and the Darkstar sequence are pure cinema.", created_at: daysAgo(20) },
  ],
};

export const POLLS: Poll[] = [
  { id: "p1", question: "What should we screen in October?", closes: "2026-10-01", status: "open", options: [
    { id: "o1", label: "Eraserhead (1977)",   votes: 87  },
    { id: "o2", label: "The Shining (1980)",  votes: 134 },
    { id: "o3", label: "Hereditary (2018)",   votes: 112 },
    { id: "o4", label: "Possession (1981)",   votes: 63  },
  ]},
  { id: "p2", question: "Best film of 2024 so far?", closes: "2026-09-30", status: "open", options: [
    { id: "o5", label: "Dune: Part Two", votes: 143 },
    { id: "o6", label: "Conclave",      votes: 94  },
    { id: "o7", label: "The Wild Robot",votes: 120 },
    { id: "o8", label: "Wicked",        votes: 98  },
  ]},
  { id: "p3", question: "Favourite Villeneuve film?", closes: "2026-10-15", status: "open", options: [
    { id: "o9",  label: "Dune: Part Two",    votes: 156 },
    { id: "o10", label: "Arrival (2016)",    votes: 203 },
    { id: "o11", label: "Blade Runner 2049", votes: 189 },
    { id: "o12", label: "Incendies (2010)",  votes: 77  },
  ]},
];

export const LEADERBOARD: LeaderboardRow[] = [
  { username: "CinemaVault",     reviews: 147, upvotes: 3842 },
  { username: "SunsetBoulevard", reviews: 134, upvotes: 3201 },
  { username: "FilmNoir88",      reviews: 122, upvotes: 2987 },
  { username: "ReelTalk",        reviews: 98,  upvotes: 2456 },
  { username: "NewWaveNick",     reviews: 87,  upvotes: 2110 },
  { username: "OscarBait",       reviews: 76,  upvotes: 1934 },
  { username: "KubrickFan",      reviews: 65,  upvotes: 1677 },
  { username: "ParallelLines",   reviews: 54,  upvotes: 1342 },
  { username: "VHSNostalgia",    reviews: 43,  upvotes: 987  },
  { username: "Mise_en_scene",   reviews: 38,  upvotes: 823  },
];

export function seedScreenings(): Screening[] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const mk = (i: number, offset: number, title: string, time: string, location: string): Screening => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return { id: `s${i}`, title, time, location, date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` };
  };
  return [
    mk(1, 2,  "Eraserhead (1977)",        "8:00 PM",  "The Roxy Cinema, Brooklyn"),
    mk(2, 5,  "Mulholland Drive (2001)",  "7:30 PM",  "IFC Center, Manhattan"),
    mk(3, 9,  "2001: A Space Odyssey",    "9:00 PM",  "Alamo Drafthouse, LIC"),
    mk(4, 16, "Possession (1981)",        "8:30 PM",  "Metrograph, Lower East Side"),
    mk(5, 23, "Halloween (1978)",         "10:00 PM", "Nitehawk Cinema, Williamsburg"),
  ];
}

export function seedVault(): Vault {
  return {
    watched:     MOVIES.slice(0, 6).map((m) => m.id),
    plantowatch: MOVIES.slice(4, 9).map((m) => m.id),
    favorites:   MOVIES.slice(0, 4).map((m) => m.id),
  };
}

// ─── localStorage store ───────────────────────────────────────────────────────
const KEYS = {
  reviews: "ac:v2:reviews",
  threads: "ac:v2:threads",
  userVotes: "ac:v2:uservotes",
  polls: "ac:v2:polls",
  pollVotes: "ac:v2:pollvotes",
  screenings: "ac:v2:screenings",
  vault: "ac:v2:vault",
  following: "ac:v2:following",
};

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback();
}

function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function nextId(items: { id: string }[], prefix: string): string {
  const max = items.reduce((acc, x) => Math.max(acc, Number(x.id.replace(prefix, "")) || 0), 0);
  return `${prefix}${max + 1}`;
}

export function mockReviews(): Review[] {
  return load<Review[]>(KEYS.reviews, () => REVIEWS);
}
export function mockThreads(): Record<string, Reply[]> {
  return load<Record<string, Reply[]>>(KEYS.threads, () => REPLY_THREADS);
}
export function mockUserVotes(): Record<string, "up" | "down" | null> {
  return load<Record<string, "up" | "down" | null>>(KEYS.userVotes, () => ({}));
}
export function mockPolls(): Poll[] {
  return load<Poll[]>(KEYS.polls, () => POLLS);
}
export function mockPollVotes(): Record<string, number> {
  return load<Record<string, number>>(KEYS.pollVotes, () => ({}));
}
export function mockScreenings(): Screening[] {
  return load<Screening[]>(KEYS.screenings, () => seedScreenings());
}
export function mockVault(): Vault {
  return load<Vault>(KEYS.vault, () => seedVault());
}
export function mockFollowing(): string[] {
  return load<string[]>(KEYS.following, () => []);
}

// ─── Mutations (mirror the old prototype handlers) ────────────────────────────
export function mockVoteReview(id: string, dir: "up" | "down") {
  const votes = mockUserVotes();
  votes[id] = votes[id] === dir ? null : dir;
  save(KEYS.userVotes, votes);
}

export function mockAddReply(reviewId: string, body: string) {
  const threads = mockThreads();
  const list = threads[reviewId] ?? [];
  const reply: Reply = {
    id: nextId(list, "c"),
    review_id: reviewId,
    username: MOCK_USER.username,
    body,
    created_at: new Date().toISOString(),
  };
  threads[reviewId] = [...list, reply];
  save(KEYS.threads, threads);
}

export function mockCreateReview(input: { movie_id: string; rating: number; body: string }): Review {
  const reviews = mockReviews();
  const review: Review = {
    id: nextId(reviews, "r"),
    movie_id: input.movie_id,
    author_id: MOCK_USER.id,
    username: MOCK_USER.username,
    rating: input.rating,
    body: input.body,
    upvotes: 0,
    downvotes: 0,
    created_at: new Date().toISOString(),
  };
  save(KEYS.reviews, [review, ...reviews]);
  return review;
}

export function mockCastPollVote(pollId: string, idx: number) {
  const votes = mockPollVotes();
  if (votes[pollId] != null) return;
  votes[pollId] = idx;
  save(KEYS.pollVotes, votes);
}

export function mockToggleFavorite(movieId: string) {
  const vault = mockVault();
  const has = vault.favorites.includes(movieId);
  vault.favorites = has ? vault.favorites.filter((x) => x !== movieId) : [...vault.favorites, movieId];
  save(KEYS.vault, vault);
}

export function mockSetVaultStatus(movieId: string, status: VaultTab) {
  const vault = mockVault();
  const has = vault[status].includes(movieId);
  vault[status] = has ? vault[status].filter((x) => x !== movieId) : [...vault[status], movieId];
  save(KEYS.vault, vault);
}

export function mockToggleFollow(userId: string) {
  const following = mockFollowing();
  save(KEYS.following, following.includes(userId) ? following.filter((x) => x !== userId) : [...following, userId]);
}

export function mockAddScreening(input: Omit<Screening, "id">): Screening {
  const screenings = mockScreenings();
  const screening: Screening = { ...input, id: nextId(screenings, "s") };
  save(KEYS.screenings, [...screenings, screening]);
  return screening;
}

export function mockDeleteScreening(id: string) {
  save(KEYS.screenings, mockScreenings().filter((x) => x.id !== id));
}

export function mockAddPoll(input: { question: string; closes: string; options: string[] }): Poll {
  const polls = mockPolls();
  const poll: Poll = {
    id: nextId(polls, "p"),
    question: input.question,
    closes: input.closes || "TBD",
    status: "open",
    options: input.options.map((label, i) => ({ id: `${nextId(polls, "p")}o${i + 1}`, label, votes: 0 })),
  };
  save(KEYS.polls, [...polls, poll]);
  return poll;
}

export function mockTogglePoll(id: string) {
  save(KEYS.polls, mockPolls().map((p) => (p.id === id ? { ...p, status: p.status === "open" ? "closed" : "open" } : p)));
}

export function mockDeletePoll(id: string) {
  save(KEYS.polls, mockPolls().filter((p) => p.id !== id));
}

export function mockDeleteReview(id: string) {
  save(KEYS.reviews, mockReviews().filter((r) => r.id !== id));
}
