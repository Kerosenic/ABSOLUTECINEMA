// Absolute Cinema — seed script.
// Creates movies, demo users, reviews, comments, polls, screenings, and the
// demo user's vault. Requires service-role access.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs
//
// Demo login: cinemavault@example.com / password123

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Single source of truth: src/lib/mock.ts, pre-generated to JSON so plain Node
// (no TS loader) can read it. Frontend field `poster` maps to DB column `poster_url`.
const movies = JSON.parse(
  readFileSync(new URL("../src/lib/movies.json", import.meta.url), "utf8"),
).map(({ poster, ...m }) => ({ ...m, poster_url: poster }));

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
  // Reset seeded tables so the script is safe to re-run. movies (upsert) and
  // users (lookup fallback) are already idempotent, so they're left alone.
  for (const table of [
    "comments", "poll_votes", "poll_options", "polls",
    "reviews", "screenings", "library_entries",
  ]) {
    const { error: resetErr } = await sb.from(table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (resetErr) throw resetErr;
  }

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
    { id: "r1", movie_id: "33", username: "CinemaVault",    rating: 9,  body: "Pixar back in peak form. Anxiety as the villain is the most honest depiction of growing up since Toy Story. The panic-attack sequence is unforgettable.", days: 2,  featured: true },
    { id: "r2", movie_id: "2", username: "FilmNoir88",      rating: 9,  body: "A quiet devastation. Past Lives understands longing better than almost any film in recent memory. Greta Lee is a force of nature.", days: 4,  featured: false },
    { id: "r3", movie_id: "3", username: "ReelTalk",        rating: 8,  body: "Villeneuve delivers a visually staggering epic. The sandworm sequences are the most awe-inspiring spectacle in years. Zendaya earns every second.", days: 7,  featured: false },
    { id: "r4", movie_id: "37", username: "SunsetBoulevard", rating: 10, body: "The most visually audacious animated film ever made. Every frame is a painting — Gwen's opening sequence alone is worth the price of admission.", days: 7,  featured: true },
    { id: "r5", movie_id: "46", username: "NewWaveNick",     rating: 8,  body: "A grim, rain-soaked detective story that finally treats Batman like a noir protagonist. Pattinson and Kravitz crackle in every scene.", days: 14, featured: false },
    { id: "r6", movie_id: "28", username: "OscarBait",       rating: 9,  body: "Pure blockbuster adrenaline with a beating heart. The final-act flight sequences are the best aerial action committed to film in years.", days: 21, featured: true },
  ];

  const reviewIdByKey = {};
  for (const r of reviewRows) {
    const movie = movies.find((m) => m.id === r.movie_id);
    const { data, error } = await sb.from("reviews")
      .insert({ author_id: userIds[r.username], movie_id: r.movie_id, title: movie.title, poster_url: movie.poster_url, rating: r.rating, body: r.body, created_at: daysAgo(r.days), featured: r.featured })
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
  // Promote the demo user to admin so the Admin console is visible.
  const { error: promoteErr } = await sb.from("profiles").update({ role: "admin" }).eq("id", demoId);
  if (promoteErr) throw promoteErr;

  for (const p of polls) {
    const { data: poll, error } = await sb.from("polls")
      .insert({ title: p.question, status: "open", expires_at: `${p.closes}T23:59:59Z`, created_by: demoId })
      .select("id").single();
    if (error) throw error;

    const optionIds = [];
    for (let i = 0; i < p.options.length; i++) {
      const { data: opt, error: oErr } = await sb.from("poll_options")
        .insert({ poll_id: poll.id, title: p.options[i], position: i })
        .select("id").single();
      if (oErr) throw oErr;
      optionIds.push(opt.id);
    }

    // Simulate base vote counts. A user may vote at most once per poll, so
    // distribute the demo users across options proportionally to `votes`
    // (largest-remainder) instead of reusing every user for every option.
    const users = Object.values(userIds);
    const total = p.votes.reduce((s, v) => s + v, 0) || 1;
    const counts = p.votes.map((v) => Math.floor((v / total) * users.length));
    let leftover = users.length - counts.reduce((s, c) => s + c, 0);
    p.votes
      .map((v, i) => ({ i, frac: (v / total) * users.length - Math.floor((v / total) * users.length) }))
      .sort((a, b) => b.frac - a.frac)
      .forEach(({ i }) => {
        if (leftover > 0) { counts[i] += 1; leftover -= 1; }
      });

    const voteRows = [];
    let cursor = 0;
    for (let i = 0; i < p.options.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        voteRows.push({ poll_id: poll.id, option_id: optionIds[i], user_id: users[cursor++] });
      }
    }
    if (voteRows.length) {
      const { error: vErr } = await sb.from("poll_votes").insert(voteRows);
      if (vErr) throw vErr;
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

  const vault = [
    { status: "watched", ids: ["2", "3", "7", "11", "12", "13"] },
    { status: "plan_to_watch", ids: ["15", "17", "18", "19", "20"] },
    { status: "favorite", ids: ["2", "3", "7", "11"] },
  ];
  for (const { status, ids } of vault) {
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
