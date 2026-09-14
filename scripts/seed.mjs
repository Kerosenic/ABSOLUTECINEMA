// Absolute Cinema — seed script.
// Creates movies, demo users, reviews, comments, polls, screenings, and the
// demo user's vault. Requires service-role access.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// Demo login: cinemavault@example.com / password123

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const movies = [
  { id: "2",  title: "Past Lives",           year: 2023, genre: "Romance",  rating: 8.7, director: "Celine Song",       poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/da/Past_Lives_film_poster.png&w=500" },
  { id: "3",  title: "Dune: Part Two",       year: 2024, genre: "Sci-Fi",   rating: 8.9, director: "Denis Villeneuve",  poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg&w=500" },
  { id: "7",  title: "Conclave",             year: 2024, genre: "Thriller", rating: 8.6, director: "Edward Berger",     poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Conclave_film_poster.jpg&w=500" },
  { id: "11", title: "The Zone of Interest", year: 2023, genre: "Drama",    rating: 9.0, director: "Jonathan Glazer",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/The_Zone_of_Interest_film_poster.jpg&w=500" },
  { id: "12", title: "Fallen Leaves",        year: 2023, genre: "Romance",  rating: 8.5, director: "Aki Kaurismäki",    poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Kuolleet_lehdet_Poster.jpg&w=500" },
  { id: "13", title: "Cabrini",              year: 2024, genre: "Drama",    rating: 7.9, director: "Alejandro Gómez",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a8/Cabrini_Official_Theatrical_Poster_%282024_film%29.jpg&w=500" },
  { id: "15", title: "A Quiet Place: Day 1", year: 2024, genre: "Horror",   rating: 7.6, director: "Michael Sarnoski",  poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/A_Quiet_Place_Day_One_%282024%29_poster.jpg&w=500" },
  { id: "17", title: "Interstellar",          year: 2014, genre: "Sci-Fi",   rating: 9.0, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg&w=500" },
  { id: "18", title: "Inception",             year: 2010, genre: "Sci-Fi",   rating: 8.8, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg&w=500" },
  { id: "19", title: "The Dark Knight",       year: 2008, genre: "Action",   rating: 9.0, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg&w=500" },
  { id: "20", title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "Action", rating: 8.7, director: "Bob Persichetti", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/fa/Spider-Man_Into_the_Spider-Verse_poster.png&w=500" },
  { id: "21", title: "La La Land",            year: 2016, genre: "Romance",  rating: 8.0, director: "Damien Chazelle",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png&w=500" },
  { id: "22", title: "Arrival",               year: 2016, genre: "Sci-Fi",   rating: 8.5, director: "Denis Villeneuve",  poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg&w=500" },
  { id: "23", title: "The Martian",           year: 2015, genre: "Sci-Fi",   rating: 8.2, director: "Ridley Scott",      poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cd/The_Martian_film_poster.jpg&w=500" },
  { id: "24", title: "Knives Out",            year: 2019, genre: "Thriller", rating: 8.1, director: "Rian Johnson",      poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/Knives_Out_poster.jpeg&w=500" },
  { id: "25", title: "Wonka",                 year: 2023, genre: "Fantasy",  rating: 7.6, director: "Paul King",         poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/90/Wonka_2023_film_poster.jpg&w=500" },
  { id: "26", title: "Barbie",                year: 2023, genre: "Fantasy",  rating: 8.0, director: "Greta Gerwig",      poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg&w=500" },
  { id: "27", title: "Coco",                  year: 2017, genre: "Fantasy",  rating: 8.6, director: "Lee Unkrich",       poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/98/Coco_%282017_film%29_poster.jpg&w=500" },
  { id: "28", title: "Top Gun: Maverick",     year: 2022, genre: "Action",   rating: 8.4, director: "Joseph Kosinski",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/13/Top_Gun_Maverick_Poster.jpg&w=500" },
  { id: "29", title: "Dune",                  year: 2021, genre: "Sci-Fi",   rating: 8.3, director: "Denis Villeneuve",  poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg&w=500" },
  { id: "30", title: "Twisters",              year: 2024, genre: "Action",   rating: 7.5, director: "Lee Isaac Chung",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/Twisters_Official_US_Theatrical_Poster.jpg&w=500" },
  { id: "31", title: "Wicked",                year: 2024, genre: "Fantasy",  rating: 7.8, director: "Jon M. Chu",        poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3c/Wicked_%282024_film%29_poster.png&w=500" },
  { id: "32", title: "The Wild Robot",        year: 2024, genre: "Sci-Fi",   rating: 8.3, director: "Chris Sanders",     poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/70/The_Wild_Robot_poster.jpg&w=500" },
  { id: "33", title: "Inside Out 2",          year: 2024, genre: "Fantasy",  rating: 7.6, director: "Kelsey Mann",       poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg&w=500" },
  { id: "34", title: "Moana 2",               year: 2024, genre: "Fantasy",  rating: 7.0, director: "David Derrick Jr.", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/73/Moana_2_poster.jpg&w=500" },
  { id: "35", title: "Godzilla x Kong: The New Empire", year: 2024, genre: "Action", rating: 6.9, director: "Adam Wingard", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg&w=500" },
  { id: "36", title: "Despicable Me 4",       year: 2024, genre: "Fantasy",  rating: 6.3, director: "Chris Renaud",      poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ed/Despicable_Me_4_Theatrical_Release_Poster.jpeg&w=500" },
  { id: "37", title: "Spider-Man: Across the Spider-Verse", year: 2023, genre: "Action", rating: 8.6, director: "Joaquim Dos Santos", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b4/Spider-Man-_Across_the_Spider-Verse_poster.jpg&w=500" },
  { id: "38", title: "The Super Mario Bros. Movie", year: 2023, genre: "Fantasy", rating: 7.1, director: "Aaron Horvath", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/44/The_Super_Mario_Bros._Movie_poster.jpg&w=500" },
  { id: "39", title: "Sonic the Hedgehog 3",  year: 2024, genre: "Action",   rating: 7.1, director: "Jeff Fowler",       poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/07/Sonic3-box-us-225.jpg&w=500" },
  { id: "40", title: "Kingdom of the Planet of the Apes", year: 2024, genre: "Sci-Fi", rating: 7.2, director: "Wes Ball", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cf/Kingdom_of_the_Planet_of_the_Apes_poster.jpg&w=500" },
  { id: "41", title: "The Fall Guy",          year: 2024, genre: "Action",   rating: 7.1, director: "David Leitch",      poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/The_Fall_Guy_%282024%29_poster.jpg&w=500" },
  { id: "42", title: "Beetlejuice Beetlejuice", year: 2024, genre: "Fantasy", rating: 6.8, director: "Tim Burton", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/ba/Beetlejuice_Beetlejuice_poster.jpg&w=500" },
  { id: "43", title: "Elemental",             year: 2023, genre: "Fantasy",  rating: 7.0, director: "Peter Sohn",        poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Elemental_final_poster.jpg&w=500" },
  { id: "44", title: "Teenage Mutant Ninja Turtles: Mutant Mayhem", year: 2023, genre: "Action", rating: 7.3, director: "Jeff Rowe", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ea/Teenage_Mutant_Ninja_Turtles_-_Mutant_Mayhem.jpg&w=500" },
  { id: "45", title: "Guardians of the Galaxy Vol. 3", year: 2023, genre: "Action", rating: 7.9, director: "James Gunn", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/74/Guardians_of_the_Galaxy_Vol._3_poster.jpg&w=500" },
  { id: "46", title: "The Batman",            year: 2022, genre: "Action",   rating: 7.8, director: "Matt Reeves",       poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/ff/The_Batman_%28film%29_poster.jpg&w=500" },
  { id: "47", title: "Avatar: The Way of Water", year: 2022, genre: "Sci-Fi", rating: 7.6, director: "James Cameron", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg&w=500" },
  { id: "48", title: "Migration",             year: 2023, genre: "Fantasy",  rating: 6.7, director: "Benjamin Renner",   poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cb/Migration_%282023_film%29.jpg&w=500" },
];

const usernames = [
  "CinemaVault", "FilmNoir88", "ReelTalk", "SunsetBoulevard", "NewWaveNick",
  "OscarBait", "KubrickFan", "ParallelLines", "VHSNostalgia", "Mise_en_scene",
];

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n) => {
  const d = new Date(Date.now() + n * 86400000);
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function main() {
  const { error: movieErr } = await sb.from("movies").upsert(movies, { onConflict: "id" });
  if (movieErr) throw movieErr;
  console.log("Seeded movies:", movies.length);

  const userIds = {};
  for (const username of usernames) {
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`;
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password: "password123",
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) {
      // User may already exist from a prior run — look it up instead.
      const list = await sb.auth.admin.listUsers();
      const found = list.data.users.find((u) => u.user_metadata?.username === username);
      if (found) {
        userIds[username] = found.id;
        continue;
      }
      console.warn("createUser failed for", username, error.message);
      continue;
    }
    userIds[username] = data.user.id;
  }
  console.log("Seeded users:", Object.keys(userIds).length);

  const reviewRows = [
    { id: "r1", movie_id: "33", username: "CinemaVault",    rating: 9,  body: "Pixar back in peak form. Anxiety as the villain is the most honest depiction of growing up since Toy Story. The panic-attack sequence is unforgettable.", days: 2 },
    { id: "r2", movie_id: "2", username: "FilmNoir88",      rating: 9,  body: "A quiet devastation. Past Lives understands longing better than almost any film in recent memory. Greta Lee is a force of nature.", days: 4 },
    { id: "r3", movie_id: "3", username: "ReelTalk",        rating: 8,  body: "Villeneuve delivers a visually staggering epic. The sandworm sequences are the most awe-inspiring spectacle in years. Zendaya earns every second.", days: 7 },
    { id: "r4", movie_id: "37", username: "SunsetBoulevard", rating: 10, body: "The most visually audacious animated film ever made. Every frame is a painting — Gwen's opening sequence alone is worth the price of admission.", days: 7 },
    { id: "r5", movie_id: "46", username: "NewWaveNick",     rating: 8,  body: "A grim, rain-soaked detective story that finally treats Batman like a noir protagonist. Pattinson and Kravitz crackle in every scene.", days: 14 },
    { id: "r6", movie_id: "28", username: "OscarBait",       rating: 9,  body: "Pure blockbuster adrenaline with a beating heart. The final-act flight sequences are the best aerial action committed to film in years.", days: 21 },
  ];

  const reviewIdByKey = {};
  for (const r of reviewRows) {
    const movie = movies.find((m) => m.id === r.movie_id);
    const { data, error } = await sb.from("reviews")
      .insert({ author_id: userIds[r.username], movie_id: r.movie_id, title: movie.title, poster_url: movie.poster_url, rating: r.rating, body: r.body, created_at: daysAgo(r.days) })
      .select("id").single();
    if (error) throw error;
    reviewIdByKey[r.id] = data.id;
  }
  console.log("Seeded reviews:", reviewRows.length);

  const threads = {
    r1: [
      { username: "KubrickFan",    body: "The emotion-island aging gag had me in tears. Pixar still has it." },
      { username: "ParallelLines", body: "Anxiety was genuinely terrifying — and painfully real." },
    ],
    r2: [{ username: "VHSNostalgia", body: "The ending wrecked me. Celine Song is the real deal." }],
    r3: [
      { username: "Mise_en_scene", body: "I've watched the Harkonnen arrival three times. It's flawless." },
      { username: "KubrickFan",    body: "Hans Zimmer deserved the Oscar for this score, full stop." },
    ],
    r4: [{ username: "FilmNoir88", body: "The Spot might be the best-animated villain in a decade." }],
    r5: [{ username: "ReelTalk", body: "The Batmobile chase is up there with the best chase scenes ever filmed." }],
    r6: [{ username: "Mise_en_scene", body: "The training montages and the Darkstar sequence are pure cinema." }],
  };
  for (const [key, replies] of Object.entries(threads)) {
    for (const c of replies) {
      const { error } = await sb.from("comments").insert({ review_id: reviewIdByKey[key], author_id: userIds[c.username], body: c.body });
      if (error) throw error;
    }
  }
  console.log("Seeded comments.");

  const polls = [
    {
      question: "What should we screen in October?",
      closes: "2026-10-01",
      options: ["Eraserhead (1977)", "The Shining (1980)", "Hereditary (2018)", "Possession (1981)"],
      votes: [87, 134, 112, 63],
    },
    {
      question: "Best film of 2024 so far?",
      closes: "2026-09-30",
      options: ["Dune: Part Two", "Conclave", "The Wild Robot", "Wicked"],
      votes: [143, 94, 120, 98],
    },
    {
      question: "Favourite Villeneuve film?",
      closes: "2026-10-15",
      options: ["Dune: Part Two", "Arrival (2016)", "Blade Runner 2049", "Incendies (2010)"],
      votes: [156, 203, 189, 77],
    },
  ];
  const demoId = userIds["CinemaVault"];
  for (const p of polls) {
    const { data: poll, error } = await sb.from("polls")
      .insert({ title: p.question, status: "open", expires_at: `${p.closes}T23:59:59Z`, created_by: demoId })
      .select("id").single();
    if (error) throw error;
    for (let i = 0; i < p.options.length; i++) {
      const { data: opt, error: oErr } = await sb.from("poll_options")
        .insert({ poll_id: poll.id, title: p.options[i], position: i })
        .select("id").single();
      if (oErr) throw oErr;
      // Simulate base vote counts with synthetic voter rows.
      const voters = Object.values(userIds).slice(0, Math.min(p.votes[i], Object.values(userIds).length));
      const voteRows = voters.map((uid, j) => ({ poll_id: poll.id, option_id: opt.id, user_id: uid }));
      if (voteRows.length) {
        const { error: vErr } = await sb.from("poll_votes").insert(voteRows);
        if (vErr) throw vErr;
      }
    }
  }
  console.log("Seeded polls:", polls.length);

  const screenings = [
    { title: "Eraserhead (1977)",       offset: 2,  time: "20:00:00", location: "The Roxy Cinema, Brooklyn" },
    { title: "Mulholland Drive (2001)", offset: 5,  time: "19:30:00", location: "IFC Center, Manhattan" },
    { title: "2001: A Space Odyssey",   offset: 9,  time: "21:00:00", location: "Alamo Drafthouse, LIC" },
    { title: "Possession (1981)",       offset: 16, time: "20:30:00", location: "Metrograph, Lower East Side" },
    { title: "Halloween (1978)",        offset: 23, time: "22:00:00", location: "Nitehawk Cinema, Williamsburg" },
  ];
  for (const s of screenings) {
    const { error } = await sb.from("screenings").insert({ title: s.title, date: daysFromNow(s.offset), time: s.time, location: s.location });
    if (error) throw error;
  }
  console.log("Seeded screenings:", screenings.length);

  const vault = { watched: ["2", "3", "7", "11", "12", "13"], plantowatch: ["15", "17", "18", "19", "20"], favorites: ["2", "3", "7", "11"] };
  for (const [status, ids] of Object.entries(vault)) {
    for (const movieId of ids) {
      const movie = movies.find((m) => m.id === movieId);
      const { error } = await sb.from("library_entries").insert({ user_id: demoId, movie_id: movieId, title: movie.title, poster_url: movie.poster_url, status });
      if (error) throw error;
    }
  }
  console.log("Seeded vault.");

  console.log("Done. Demo login: cinemavault@example.com / password123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
