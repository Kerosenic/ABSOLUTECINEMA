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
  { id: "49", title: "Project Hail Mary", year: 2026, genre: "Sci-Fi", rating: 7.8, director: "Phil Lord & Christopher Miller", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3b/Project_Hail_Mary_poster.jpg&w=500" },
  { id: "50", title: "Ne Zha 2", year: 2025, genre: "Fantasy", rating: 7.7, director: "Jiaozi", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b6/Ne_Zha_2_poster.jpg&w=500" },
  { id: "51", title: "The Odyssey", year: 2026, genre: "Fantasy", rating: 7.4, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/90/The_Odyssey_%282026_film%29_poster.jpg&w=500" },
  { id: "52", title: "Jojo Rabbit", year: 2019, genre: "Drama", rating: 7.9, director: "Taika Waititi", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a2/Jojo_Rabbit_%282019%29_poster.jpg&w=500" },
  { id: "53", title: "Fantastic Mr. Fox", year: 2009, genre: "Fantasy", rating: 7.9, director: "Wes Anderson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/af/Fantastic_mr_fox.jpg&w=500" },
  { id: "54", title: "Isle of Dogs", year: 2018, genre: "Fantasy", rating: 7.8, director: "Wes Anderson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/23/IsleOfDogsFirstLook.jpg&w=500" },
  { id: "55", title: "Back to the Future", year: 1985, genre: "Sci-Fi", rating: 8.5, director: "Robert Zemeckis", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Back_to_the_Future.jpg&w=500" },
  { id: "56", title: "Rocky", year: 1976, genre: "Drama", rating: 8.1, director: "John G. Avildsen", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/18/Rocky_poster.jpg&w=500" },
  { id: "57", title: "Superman", year: 2025, genre: "Action", rating: 7, director: "James Gunn", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/32/Superman_%282025_film%29_poster.jpg&w=500" },
  { id: "58", title: "Star Wars", year: 1977, genre: "Sci-Fi", rating: 8.6, director: "George Lucas", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/87/StarWarsMoviePoster1977.jpg&w=500" },
  { id: "59", title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, genre: "Fantasy", rating: 8.9, director: "Peter Jackson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg&w=500" },
  { id: "60", title: "The Lord of the Rings: The Two Towers", year: 2002, genre: "Fantasy", rating: 8.8, director: "Peter Jackson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a1/Lord_Rings_Two_Towers.jpg&w=500" },
  { id: "61", title: "The Lord of the Rings: The Return of the King", year: 2003, genre: "Fantasy", rating: 9, director: "Peter Jackson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/48/Lord_Rings_Return_King.jpg&w=500" },
  { id: "62", title: "Ask This of Rikyu", year: 2013, genre: "Drama", rating: 7.1, director: "Mitsutoshi Tanaka", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/15/Ask_This_of_Rikyu_poster.jpeg&w=500" },
  { id: "63", title: "Spider-Man: Brand New Day", year: 2026, genre: "Action", rating: 7.2, director: "Destin Daniel Cretton", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9a/Spider-Man_Brand_New_Day_poster.jpg&w=500" },
  { id: "64", title: "Spirited Away", year: 2001, genre: "Fantasy", rating: 8.6, director: "Hayao Miyazaki", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png&w=500" },
  { id: "65", title: "My Neighbor Totoro", year: 1988, genre: "Fantasy", rating: 8.1, director: "Hayao Miyazaki", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/02/My_Neighbor_Totoro_-_Tonari_no_Totoro_%28Movie_Poster%29.jpg&w=500" },
  { id: "66", title: "Princess Mononoke", year: 1997, genre: "Fantasy", rating: 8.3, director: "Hayao Miyazaki", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8c/Princess_Mononoke_Japanese_poster.png&w=500" },
  { id: "67", title: "Howl's Moving Castle", year: 2004, genre: "Fantasy", rating: 8.2, director: "Hayao Miyazaki", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a0/Howls-moving-castleposter.jpg&w=500" },
  { id: "68", title: "Your Name", year: 2016, genre: "Romance", rating: 8.4, director: "Makoto Shinkai", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0b/Your_Name_poster.png&w=500" },
  { id: "69", title: "Toy Story", year: 1995, genre: "Fantasy", rating: 8.3, director: "John Lasseter", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/13/Toy_Story.jpg&w=500" },
  { id: "70", title: "Finding Nemo", year: 2003, genre: "Fantasy", rating: 8.2, director: "Andrew Stanton", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/29/Finding_Nemo.jpg&w=500" },
  { id: "71", title: "WALL-E", year: 2008, genre: "Sci-Fi", rating: 8.4, director: "Andrew Stanton", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4c/WALL-E_poster.jpg&w=500" },
  { id: "72", title: "Up", year: 2009, genre: "Fantasy", rating: 8.3, director: "Pete Docter", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/05/Up_%282009_film%29.jpg&w=500" },
  { id: "73", title: "Ratatouille", year: 2007, genre: "Fantasy", rating: 8.1, director: "Brad Bird", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/50/RatatouillePoster.jpg&w=500" },
  { id: "74", title: "The Incredibles", year: 2004, genre: "Action", rating: 8, director: "Brad Bird", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/27/The_Incredibles_%282004_animated_feature_film%29.jpg&w=500" },
  { id: "75", title: "Shrek", year: 2001, genre: "Fantasy", rating: 7.9, director: "Andrew Adamson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7b/Shrek_%282001_animated_feature_film%29.jpg&w=500" },
  { id: "76", title: "How to Train Your Dragon", year: 2010, genre: "Fantasy", rating: 8.1, director: "Dean DeBlois", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/99/How_to_Train_Your_Dragon_Poster.jpg&w=500" },
  { id: "77", title: "Kung Fu Panda", year: 2008, genre: "Action", rating: 7.6, director: "Mark Osborne", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Kungfupanda.jpg&w=500" },
  { id: "78", title: "Zootopia", year: 2016, genre: "Fantasy", rating: 8, director: "Byron Howard", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/96/Zootopia_%28movie_poster%29.jpg&w=500" },
  { id: "79", title: "Frozen", year: 2013, genre: "Fantasy", rating: 7.4, director: "Chris Buck", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/05/Frozen_%282013_film%29_poster.jpg&w=500" },
  { id: "80", title: "The Lion King", year: 1994, genre: "Fantasy", rating: 8.5, director: "Roger Allers", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg&w=500" },
  { id: "81", title: "Aladdin", year: 1992, genre: "Fantasy", rating: 8, director: "Ron Clements", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/bd/Aladdin_%281992_Disney_film%29_poster.jpg&w=500" },
  { id: "82", title: "Beauty and the Beast", year: 1991, genre: "Fantasy", rating: 8, director: "Gary Trousdale", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/5e/Beauty_and_the_Beast_%281991_film%29_poster.jpg&w=500" },
  { id: "83", title: "Toy Story 3", year: 2010, genre: "Fantasy", rating: 8.3, director: "Lee Unkrich", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/6/69/Toy_Story_3_poster.jpg&w=500" },
  { id: "84", title: "Harry Potter and the Philosopher's Stone", year: 2001, genre: "Fantasy", rating: 7.6, director: "Chris Columbus", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7a/Harry_Potter_and_the_Philosopher%27s_Stone_banner.jpg&w=500" },
  { id: "85", title: "Harry Potter and the Chamber of Secrets", year: 2002, genre: "Fantasy", rating: 7.4, director: "Chris Columbus", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/c0/Harry_Potter_and_the_Chamber_of_Secrets_movie.jpg&w=500" },
  { id: "86", title: "Harry Potter and the Prisoner of Azkaban", year: 2004, genre: "Fantasy", rating: 7.9, director: "Alfonso Cuarón", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/18/Harry_Potter_and_the_Prisoner_of_Azkaban_film_poster.jpg&w=500" },
  { id: "87", title: "Harry Potter and the Goblet of Fire", year: 2005, genre: "Fantasy", rating: 7.7, director: "Mike Newell", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/c9/Harry_Potter_and_the_Goblet_of_Fire_Poster.jpg&w=500" },
  { id: "88", title: "Harry Potter and the Order of the Phoenix", year: 2007, genre: "Fantasy", rating: 7.5, director: "David Yates", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/Harry_Potter_and_the_Order_of_the_Phoenix_poster.jpg&w=500" },
  { id: "89", title: "Harry Potter and the Half-Blood Prince", year: 2009, genre: "Fantasy", rating: 7.6, director: "David Yates", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3f/Harry_Potter_and_the_Half-Blood_Prince_poster.jpg&w=500" },
  { id: "90", title: "Harry Potter and the Deathly Hallows – Part 1", year: 2010, genre: "Fantasy", rating: 7.7, director: "David Yates", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2d/Harry_Potter_and_the_Deathly_Hallows_%E2%80%93_Part_1.jpg&w=500" },
  { id: "91", title: "Harry Potter and the Deathly Hallows – Part 2", year: 2011, genre: "Fantasy", rating: 8.1, director: "David Yates", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/df/Harry_Potter_and_the_Deathly_Hallows_%E2%80%93_Part_2.jpg&w=500" },
  { id: "92", title: "Iron Man", year: 2008, genre: "Action", rating: 7.9, director: "Jon Favreau", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg&w=500" },
  { id: "93", title: "The Avengers", year: 2012, genre: "Action", rating: 8, director: "Joss Whedon", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8a/The_Avengers_%282012_film%29_poster.jpg&w=500" },
  { id: "94", title: "Captain America: The Winter Soldier", year: 2014, genre: "Action", rating: 7.7, director: "Anthony and Joe Russo", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9e/Captain_America_The_Winter_Soldier_poster.jpg&w=500" },
  { id: "95", title: "Avengers: Infinity War", year: 2018, genre: "Action", rating: 8.4, director: "Anthony and Joe Russo", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Avengers_Infinity_War_poster.jpg&w=500" },
  { id: "96", title: "Avengers: Endgame", year: 2019, genre: "Action", rating: 8.4, director: "Anthony and Joe Russo", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg&w=500" },
  { id: "97", title: "Thor: Ragnarok", year: 2017, genre: "Action", rating: 7.9, director: "Taika Waititi", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg&w=500" },
  { id: "98", title: "Black Panther", year: 2018, genre: "Action", rating: 7.3, director: "Ryan Coogler", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d6/Black_Panther_%28film%29_poster.jpg&w=500" },
  { id: "99", title: "Spider-Man: Homecoming", year: 2017, genre: "Action", rating: 7.4, director: "Jon Watts", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f9/Spider-Man_Homecoming_poster.jpg&w=500" },
  { id: "100", title: "Spider-Man: No Way Home", year: 2021, genre: "Action", rating: 8.2, director: "Jon Watts", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg&w=500" },
  { id: "101", title: "Doctor Strange", year: 2016, genre: "Action", rating: 7.5, director: "Scott Derrickson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a1/Doctor_Strange_%282016_film%29_poster.jpg&w=500" },
  { id: "102", title: "The Empire Strikes Back", year: 1980, genre: "Sci-Fi", rating: 8.7, director: "Irvin Kershner", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3f/The_Empire_Strikes_Back_%281980_film%29.jpg&w=500" },
  { id: "103", title: "Return of the Jedi", year: 1983, genre: "Sci-Fi", rating: 8.3, director: "Richard Marquand", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b2/ReturnOfTheJediPoster1983.jpg&w=500" },
  { id: "104", title: "Star Wars: The Force Awakens", year: 2015, genre: "Sci-Fi", rating: 7.8, director: "J. J. Abrams", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a2/Star_Wars_The_Force_Awakens_Theatrical_Poster.jpg&w=500" },
  { id: "105", title: "Rogue One", year: 2016, genre: "Sci-Fi", rating: 7.8, director: "Gareth Edwards", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d4/Rogue_One%2C_A_Star_Wars_Story_poster.png&w=500" },
  { id: "106", title: "Jurassic Park", year: 1993, genre: "Sci-Fi", rating: 8.2, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg&w=500" },
  { id: "107", title: "E.T. the Extra-Terrestrial", year: 1982, genre: "Sci-Fi", rating: 7.9, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/6/66/E_t_the_extra_terrestrial_ver3.jpg&w=500" },
  { id: "108", title: "Close Encounters of the Third Kind", year: 1977, genre: "Sci-Fi", rating: 7.6, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/ba/Close_Encounters_of_the_Third_Kind_%281977%29_theatrical_poster.jpg&w=500" },
  { id: "109", title: "Minority Report", year: 2002, genre: "Sci-Fi", rating: 7.6, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/44/Minority_Report_Poster.jpg&w=500" },
  { id: "110", title: "Avatar", year: 2009, genre: "Sci-Fi", rating: 7.9, director: "James Cameron", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg&w=500" },
  { id: "111", title: "Gravity", year: 2013, genre: "Sci-Fi", rating: 7.7, director: "Alfonso Cuarón", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f6/Gravity_Poster.jpg&w=500" },
  { id: "112", title: "Contact", year: 1997, genre: "Sci-Fi", rating: 7.5, director: "Robert Zemeckis", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/75/Contact_ver2.jpg&w=500" },
  { id: "113", title: "The Truman Show", year: 1998, genre: "Drama", rating: 8.2, director: "Peter Weir", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cd/Trumanshow.jpg&w=500" },
  { id: "114", title: "Raiders of the Lost Ark", year: 1981, genre: "Action", rating: 8.4, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4c/Raiders_of_the_Lost_Ark.jpg&w=500" },
  { id: "115", title: "Pirates of the Caribbean: The Curse of the Black Pearl", year: 2003, genre: "Action", rating: 8.1, director: "Gore Verbinski", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/89/Pirates_of_the_Caribbean_-_The_Curse_of_the_Black_Pearl.png&w=500" },
  { id: "116", title: "Mission: Impossible – Fallout", year: 2018, genre: "Action", rating: 7.7, director: "Christopher McQuarrie", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/ff/MI_%E2%80%93_Fallout.jpg&w=500" },
  { id: "117", title: "Casino Royale", year: 2006, genre: "Action", rating: 8, director: "Martin Campbell", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/82/Casino_Royale_%282006_film_poster%29.jpg&w=500" },
  { id: "118", title: "Skyfall", year: 2012, genre: "Action", rating: 7.8, director: "Sam Mendes", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a7/Skyfall_poster.jpg&w=500" },
  { id: "119", title: "The Karate Kid", year: 1984, genre: "Action", rating: 7.3, director: "John G. Avildsen", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a9/Karate_kid.jpg&w=500" },
  { id: "120", title: "The Princess Bride", year: 1987, genre: "Fantasy", rating: 8, director: "Rob Reiner", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/db/Princess_bride.jpg&w=500" },
  { id: "121", title: "Forrest Gump", year: 1994, genre: "Drama", rating: 8.8, director: "Robert Zemeckis", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg&w=500" },
  { id: "122", title: "Titanic", year: 1997, genre: "Romance", rating: 7.9, director: "James Cameron", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png&w=500" },
  { id: "123", title: "Cast Away", year: 2000, genre: "Drama", rating: 7.8, director: "Robert Zemeckis", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a7/Cast_away_film_poster.jpg&w=500" },
  { id: "124", title: "Apollo 13", year: 1995, genre: "Drama", rating: 7.7, director: "Ron Howard", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9e/Apollo_thirteen_movie.jpg&w=500" },
  { id: "125", title: "Dead Poets Society", year: 1989, genre: "Drama", rating: 8.1, director: "Peter Weir", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/86/Dead_poets_society.png&w=500" },
  { id: "126", title: "The Pursuit of Happyness", year: 2006, genre: "Drama", rating: 8, director: "Gabriele Muccino", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/81/Poster-pursuithappyness.jpg&w=500" },
  { id: "127", title: "Hidden Figures", year: 2016, genre: "Drama", rating: 7.8, director: "Theodore Melfi", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4f/The_official_poster_for_the_film_Hidden_Figures%2C_2016.jpg&w=500" },
  { id: "128", title: "A Beautiful Mind", year: 2001, genre: "Drama", rating: 8.2, director: "Ron Howard", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b8/A_Beautiful_Mind_Poster.jpg&w=500" },
  { id: "129", title: "The Imitation Game", year: 2014, genre: "Drama", rating: 8, director: "Morten Tyldum", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/87/The_Imitation_Game_%282014%29.png&w=500" },
  { id: "130", title: "Ford v Ferrari", year: 2019, genre: "Action", rating: 8.1, director: "James Mangold", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a4/Ford_v._Ferrari_%282019_film_poster%29.png&w=500" },
  { id: "131", title: "Moneyball", year: 2011, genre: "Drama", rating: 7.6, director: "Bennett Miller", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2e/Moneyball_Poster.jpg&w=500" },
  { id: "132", title: "The Social Network", year: 2010, genre: "Drama", rating: 7.8, director: "David Fincher", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8c/The_Social_Network_film_poster.png&w=500" },
  { id: "133", title: "Catch Me If You Can", year: 2002, genre: "Drama", rating: 8.1, director: "Steven Spielberg", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Catch_Me_If_You_Can_2002_movie.jpg&w=500" },
  { id: "134", title: "The Prestige", year: 2006, genre: "Thriller", rating: 8.5, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Prestige_poster.jpg&w=500" },
  { id: "135", title: "Dunkirk", year: 2017, genre: "Action", rating: 7.8, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/15/Dunkirk_Film_poster.jpg&w=500" },
  { id: "136", title: "Tenet", year: 2020, genre: "Sci-Fi", rating: 7.3, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/14/Tenet_movie_poster.jpg&w=500" },
  { id: "137", title: "Batman Begins", year: 2005, genre: "Action", rating: 8.2, director: "Christopher Nolan", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/af/Batman_Begins_Poster.jpg&w=500" },
  { id: "138", title: "The Sound of Music", year: 1965, genre: "Drama", rating: 8.1, director: "Robert Wise", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/c/c6/Sound_of_music.jpg&w=500" },
  { id: "139", title: "Singin' in the Rain", year: 1952, genre: "Romance", rating: 8.3, director: "Stanley Donen", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/5/5d/Singin%27_in_the_Rain_%281952_poster%29.jpg&w=500" },
  { id: "140", title: "The Wizard of Oz", year: 1939, genre: "Fantasy", rating: 8.1, director: "Victor Fleming", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/6/69/Wizard_of_oz_movie_poster.jpg&w=500" },
  { id: "141", title: "Mary Poppins", year: 1964, genre: "Fantasy", rating: 7.8, director: "Robert Stevenson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/78/Marypoppins.jpg&w=500" },
  { id: "142", title: "The Greatest Showman", year: 2017, genre: "Drama", rating: 7.5, director: "Michael Gracey", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/10/The_Greatest_Showman_poster.png&w=500" },
  { id: "143", title: "Mamma Mia!", year: 2008, genre: "Romance", rating: 6.5, director: "Phyllida Lloyd", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/95/Mamma_Mia_%282008%29_US_poster.jpg&w=500" },
  { id: "144", title: "Groundhog Day", year: 1993, genre: "Fantasy", rating: 8, director: "Harold Ramis", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b1/Groundhog_Day_%28movie_poster%29.jpg&w=500" },
  { id: "145", title: "Ghostbusters", year: 1984, genre: "Fantasy", rating: 7.8, director: "Ivan Reitman", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2f/Ghostbusters_%281984%29_theatrical_poster.png&w=500" },
  { id: "146", title: "Home Alone", year: 1990, genre: "Fantasy", rating: 7.7, director: "Chris Columbus", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Home_alone_poster.jpg&w=500" },
  { id: "147", title: "Ferris Bueller's Day Off", year: 1986, genre: "Drama", rating: 7.8, director: "John Hughes", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9b/Ferris_Bueller%27s_Day_Off.jpg&w=500" },
  { id: "148", title: "Moonrise Kingdom", year: 2012, genre: "Romance", rating: 7.8, director: "Wes Anderson", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4f/Moonrise_Kingdom_FilmPoster.jpeg&w=500" },
  { id: "149", title: "Napoleon Dynamite", year: 2004, genre: "Drama", rating: 7, director: "Jared Hess", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/87/Napoleon_dynamite_post.jpg&w=500" },
  { id: "150", title: "School of Rock", year: 2003, genre: "Drama", rating: 7.2, director: "Richard Linklater", poster_url: "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/11/School_of_Rock_Poster.jpg&w=500" },
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
