// Mock backend: seed data + a localStorage store. Used when Supabase is not

// configured, so the prototype keeps working exactly as before.

import type {
  Movie,
  Review,
  ReviewTag,
  Reply,
  Poll,
  Screening,
  Vault,
  VaultTab,
  LeaderboardRow,
  Profile,
  Notification,
  Announcement,
  MovieRating,
} from "./types"

export const MOCK_USER: Profile = {
  id: "u1",
  username: "CinemaVault",
  role: "admin",
  avatar_url: null,
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

// ─── Seed data ────────────────────────────────────────────────────────────────

export const MOVIES: Movie[] = [
  {
    id: "2",
    title: "Past Lives",
    year: 2023,
    genre: "Romance",
    rating: 8.7,
    director: "Celine Song",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/da/Past_Lives_film_poster.png&w=500",
  },

  {
    id: "3",
    title: "Dune: Part Two",
    year: 2024,
    genre: "Sci-Fi",
    rating: 8.9,
    director: "Denis Villeneuve",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg&w=500",
  },

  {
    id: "7",
    title: "Conclave",
    year: 2024,
    genre: "Thriller",
    rating: 8.6,
    director: "Edward Berger",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Conclave_film_poster.jpg&w=500",
  },

  {
    id: "11",
    title: "The Zone of Interest",
    year: 2023,
    genre: "Drama",
    rating: 9.0,
    director: "Jonathan Glazer",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/The_Zone_of_Interest_film_poster.jpg&w=500",
  },

  {
    id: "12",
    title: "Fallen Leaves",
    year: 2023,
    genre: "Romance",
    rating: 8.5,
    director: "Aki Kaurismäki",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Kuolleet_lehdet_Poster.jpg&w=500",
  },

  {
    id: "13",
    title: "Cabrini",
    year: 2024,
    genre: "Drama",
    rating: 7.9,
    director: "Alejandro Gómez",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a8/Cabrini_Official_Theatrical_Poster_%282024_film%29.jpg&w=500",
  },

  {
    id: "15",
    title: "A Quiet Place: Day 1",
    year: 2024,
    genre: "Horror",
    rating: 7.6,
    director: "Michael Sarnoski",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/A_Quiet_Place_Day_One_%282024%29_poster.jpg&w=500",
  },

  {
    id: "17",
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi",
    rating: 9.0,
    director: "Christopher Nolan",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg&w=500",
  },

  {
    id: "18",
    title: "Inception",
    year: 2010,
    genre: "Sci-Fi",
    rating: 8.8,
    director: "Christopher Nolan",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg&w=500",
  },

  {
    id: "19",
    title: "The Dark Knight",
    year: 2008,
    genre: "Action",
    rating: 9.0,
    director: "Christopher Nolan",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg&w=500",
  },

  {
    id: "20",
    title: "Spider-Man: Into the Spider-Verse",
    year: 2018,
    genre: "Action",
    rating: 8.7,
    director: "Bob Persichetti",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/fa/Spider-Man_Into_the_Spider-Verse_poster.png&w=500",
  },

  {
    id: "21",
    title: "La La Land",
    year: 2016,
    genre: "Romance",
    rating: 8.0,
    director: "Damien Chazelle",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png&w=500",
  },

  {
    id: "22",
    title: "Arrival",
    year: 2016,
    genre: "Sci-Fi",
    rating: 8.5,
    director: "Denis Villeneuve",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/df/Arrival%2C_Movie_Poster.jpg&w=500",
  },

  {
    id: "23",
    title: "The Martian",
    year: 2015,
    genre: "Sci-Fi",
    rating: 8.2,
    director: "Ridley Scott",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cd/The_Martian_film_poster.jpg&w=500",
  },

  {
    id: "24",
    title: "Knives Out",
    year: 2019,
    genre: "Thriller",
    rating: 8.1,
    director: "Rian Johnson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/Knives_Out_poster.jpeg&w=500",
  },

  {
    id: "25",
    title: "Wonka",
    year: 2023,
    genre: "Fantasy",
    rating: 7.6,
    director: "Paul King",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/90/Wonka_2023_film_poster.jpg&w=500",
  },

  {
    id: "26",
    title: "Barbie",
    year: 2023,
    genre: "Fantasy",
    rating: 8.0,
    director: "Greta Gerwig",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0b/Barbie_2023_poster.jpg&w=500",
  },

  {
    id: "27",
    title: "Coco",
    year: 2017,
    genre: "Fantasy",
    rating: 8.6,
    director: "Lee Unkrich",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/98/Coco_%282017_film%29_poster.jpg&w=500",
  },

  {
    id: "28",
    title: "Top Gun: Maverick",
    year: 2022,
    genre: "Action",
    rating: 8.4,
    director: "Joseph Kosinski",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/13/Top_Gun_Maverick_Poster.jpg&w=500",
  },

  {
    id: "29",
    title: "Dune",
    year: 2021,
    genre: "Sci-Fi",
    rating: 8.3,
    director: "Denis Villeneuve",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8e/Dune_%282021_film%29.jpg&w=500",
  },

  {
    id: "30",
    title: "Twisters",
    year: 2024,
    genre: "Action",
    rating: 7.5,
    director: "Lee Isaac Chung",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/24/Twisters_Official_US_Theatrical_Poster.jpg&w=500",
  },

  {
    id: "31",
    title: "Wicked",
    year: 2024,
    genre: "Fantasy",
    rating: 7.8,
    director: "Jon M. Chu",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3c/Wicked_%282024_film%29_poster.png&w=500",
  },

  {
    id: "32",
    title: "The Wild Robot",
    year: 2024,
    genre: "Sci-Fi",
    rating: 8.3,
    director: "Chris Sanders",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/70/The_Wild_Robot_poster.jpg&w=500",
  },

  {
    id: "33",
    title: "Inside Out 2",
    year: 2024,
    genre: "Fantasy",
    rating: 7.6,
    director: "Kelsey Mann",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f7/Inside_Out_2_poster.jpg&w=500",
  },

  {
    id: "34",
    title: "Moana 2",
    year: 2024,
    genre: "Fantasy",
    rating: 7.0,
    director: "David Derrick Jr.",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/73/Moana_2_poster.jpg&w=500",
  },

  {
    id: "35",
    title: "Godzilla x Kong: The New Empire",
    year: 2024,
    genre: "Action",
    rating: 6.9,
    director: "Adam Wingard",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg&w=500",
  },

  {
    id: "36",
    title: "Despicable Me 4",
    year: 2024,
    genre: "Fantasy",
    rating: 6.3,
    director: "Chris Renaud",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ed/Despicable_Me_4_Theatrical_Release_Poster.jpeg&w=500",
  },

  {
    id: "37",
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    genre: "Action",
    rating: 8.6,
    director: "Joaquim Dos Santos",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b4/Spider-Man-_Across_the_Spider-Verse_poster.jpg&w=500",
  },

  {
    id: "38",
    title: "The Super Mario Bros. Movie",
    year: 2023,
    genre: "Fantasy",
    rating: 7.1,
    director: "Aaron Horvath",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/44/The_Super_Mario_Bros._Movie_poster.jpg&w=500",
  },

  {
    id: "39",
    title: "Sonic the Hedgehog 3",
    year: 2024,
    genre: "Action",
    rating: 7.1,
    director: "Jeff Fowler",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/07/Sonic3-box-us-225.jpg&w=500",
  },

  {
    id: "40",
    title: "Kingdom of the Planet of the Apes",
    year: 2024,
    genre: "Sci-Fi",
    rating: 7.2,
    director: "Wes Ball",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cf/Kingdom_of_the_Planet_of_the_Apes_poster.jpg&w=500",
  },

  {
    id: "41",
    title: "The Fall Guy",
    year: 2024,
    genre: "Action",
    rating: 7.1,
    director: "David Leitch",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/1f/The_Fall_Guy_%282024%29_poster.jpg&w=500",
  },

  {
    id: "42",
    title: "Beetlejuice Beetlejuice",
    year: 2024,
    genre: "Fantasy",
    rating: 6.8,
    director: "Tim Burton",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/ba/Beetlejuice_Beetlejuice_poster.jpg&w=500",
  },

  {
    id: "43",
    title: "Elemental",
    year: 2023,
    genre: "Fantasy",
    rating: 7.0,
    director: "Peter Sohn",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Elemental_final_poster.jpg&w=500",
  },

  {
    id: "44",
    title: "Teenage Mutant Ninja Turtles: Mutant Mayhem",
    year: 2023,
    genre: "Action",
    rating: 7.3,
    director: "Jeff Rowe",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ea/Teenage_Mutant_Ninja_Turtles_-_Mutant_Mayhem.jpg&w=500",
  },

  {
    id: "45",
    title: "Guardians of the Galaxy Vol. 3",
    year: 2023,
    genre: "Action",
    rating: 7.9,
    director: "James Gunn",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/74/Guardians_of_the_Galaxy_Vol._3_poster.jpg&w=500",
  },

  {
    id: "46",
    title: "The Batman",
    year: 2022,
    genre: "Action",
    rating: 7.8,
    director: "Matt Reeves",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/ff/The_Batman_%28film%29_poster.jpg&w=500",
  },

  {
    id: "47",
    title: "Avatar: The Way of Water",
    year: 2022,
    genre: "Sci-Fi",
    rating: 7.6,
    director: "James Cameron",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/54/Avatar_The_Way_of_Water_poster.jpg&w=500",
  },

  {
    id: "48",
    title: "Migration",
    year: 2023,
    genre: "Fantasy",
    rating: 6.7,
    director: "Benjamin Renner",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/cb/Migration_%282023_film%29.jpg&w=500",
  },

  {
    id: "49",
    title: "Project Hail Mary",
    year: 2026,
    genre: "Sci-Fi",
    rating: 7.8,
    director: "Phil Lord & Christopher Miller",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3b/Project_Hail_Mary_poster.jpg&w=500",
  },

  {
    id: "50",
    title: "Ne Zha 2",
    year: 2025,
    genre: "Fantasy",
    rating: 7.7,
    director: "Jiaozi",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b6/Ne_Zha_2_poster.jpg&w=500",
  },

  {
    id: "51",
    title: "The Odyssey",
    year: 2026,
    genre: "Fantasy",
    rating: 7.4,
    director: "Christopher Nolan",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/90/The_Odyssey_%282026_film%29_poster.jpg&w=500",
  },

  {
    id: "52",
    title: "Jojo Rabbit",
    year: 2019,
    genre: "Drama",
    rating: 7.9,
    director: "Taika Waititi",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a2/Jojo_Rabbit_%282019%29_poster.jpg&w=500",
  },

  {
    id: "53",
    title: "Fantastic Mr. Fox",
    year: 2009,
    genre: "Fantasy",
    rating: 7.9,
    director: "Wes Anderson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/af/Fantastic_mr_fox.jpg&w=500",
  },

  {
    id: "54",
    title: "Isle of Dogs",
    year: 2018,
    genre: "Fantasy",
    rating: 7.8,
    director: "Wes Anderson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/23/IsleOfDogsFirstLook.jpg&w=500",
  },

  {
    id: "55",
    title: "Back to the Future",
    year: 1985,
    genre: "Sci-Fi",
    rating: 8.5,
    director: "Robert Zemeckis",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d2/Back_to_the_Future.jpg&w=500",
  },

  {
    id: "56",
    title: "Rocky",
    year: 1976,
    genre: "Drama",
    rating: 8.1,
    director: "John G. Avildsen",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/18/Rocky_poster.jpg&w=500",
  },

  {
    id: "57",
    title: "Superman",
    year: 2025,
    genre: "Action",
    rating: 7,
    director: "James Gunn",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/32/Superman_%282025_film%29_poster.jpg&w=500",
  },

  {
    id: "58",
    title: "Star Wars",
    year: 1977,
    genre: "Sci-Fi",
    rating: 8.6,
    director: "George Lucas",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/87/StarWarsMoviePoster1977.jpg&w=500",
  },

  {
    id: "59",
    title: "The Lord of the Rings: The Fellowship of the Ring",
    year: 2001,
    genre: "Fantasy",
    rating: 8.9,
    director: "Peter Jackson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/fb/Lord_Rings_Fellowship_Ring.jpg&w=500",
  },

  {
    id: "60",
    title: "The Lord of the Rings: The Two Towers",
    year: 2002,
    genre: "Fantasy",
    rating: 8.8,
    director: "Peter Jackson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a1/Lord_Rings_Two_Towers.jpg&w=500",
  },

  {
    id: "61",
    title: "The Lord of the Rings: The Return of the King",
    year: 2003,
    genre: "Fantasy",
    rating: 9,
    director: "Peter Jackson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/48/Lord_Rings_Return_King.jpg&w=500",
  },

  {
    id: "62",
    title: "Ask This of Rikyu",
    year: 2013,
    genre: "Drama",
    rating: 7.1,
    director: "Mitsutoshi Tanaka",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/15/Ask_This_of_Rikyu_poster.jpeg&w=500",
  },

  {
    id: "63",
    title: "Spider-Man: Brand New Day",
    year: 2026,
    genre: "Action",
    rating: 7.2,
    director: "Destin Daniel Cretton",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9a/Spider-Man_Brand_New_Day_poster.jpg&w=500",
  },

  {
    id: "64",
    title: "Spirited Away",
    year: 2001,
    genre: "Fantasy",
    rating: 8.6,
    director: "Hayao Miyazaki",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png&w=500",
  },

  {
    id: "65",
    title: "My Neighbor Totoro",
    year: 1988,
    genre: "Fantasy",
    rating: 8.1,
    director: "Hayao Miyazaki",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/02/My_Neighbor_Totoro_-_Tonari_no_Totoro_%28Movie_Poster%29.jpg&w=500",
  },

  {
    id: "66",
    title: "Princess Mononoke",
    year: 1997,
    genre: "Fantasy",
    rating: 8.3,
    director: "Hayao Miyazaki",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8c/Princess_Mononoke_Japanese_poster.png&w=500",
  },

  {
    id: "67",
    title: "Howl's Moving Castle",
    year: 2004,
    genre: "Fantasy",
    rating: 8.2,
    director: "Hayao Miyazaki",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a0/Howls-moving-castleposter.jpg&w=500",
  },

  {
    id: "68",
    title: "Your Name",
    year: 2016,
    genre: "Romance",
    rating: 8.4,
    director: "Makoto Shinkai",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0b/Your_Name_poster.png&w=500",
  },

  {
    id: "69",
    title: "Toy Story",
    year: 1995,
    genre: "Fantasy",
    rating: 8.3,
    director: "John Lasseter",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/13/Toy_Story.jpg&w=500",
  },

  {
    id: "70",
    title: "Finding Nemo",
    year: 2003,
    genre: "Fantasy",
    rating: 8.2,
    director: "Andrew Stanton",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/29/Finding_Nemo.jpg&w=500",
  },

  {
    id: "71",
    title: "WALL-E",
    year: 2008,
    genre: "Sci-Fi",
    rating: 8.4,
    director: "Andrew Stanton",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4c/WALL-E_poster.jpg&w=500",
  },

  {
    id: "72",
    title: "Up",
    year: 2009,
    genre: "Fantasy",
    rating: 8.3,
    director: "Pete Docter",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/05/Up_%282009_film%29.jpg&w=500",
  },

  {
    id: "73",
    title: "Ratatouille",
    year: 2007,
    genre: "Fantasy",
    rating: 8.1,
    director: "Brad Bird",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/50/RatatouillePoster.jpg&w=500",
  },

  {
    id: "74",
    title: "The Incredibles",
    year: 2004,
    genre: "Action",
    rating: 8,
    director: "Brad Bird",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/27/The_Incredibles_%282004_animated_feature_film%29.jpg&w=500",
  },

  {
    id: "75",
    title: "Shrek",
    year: 2001,
    genre: "Fantasy",
    rating: 7.9,
    director: "Andrew Adamson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7b/Shrek_%282001_animated_feature_film%29.jpg&w=500",
  },

  {
    id: "76",
    title: "How to Train Your Dragon",
    year: 2010,
    genre: "Fantasy",
    rating: 8.1,
    director: "Dean DeBlois",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/99/How_to_Train_Your_Dragon_Poster.jpg&w=500",
  },

  {
    id: "77",
    title: "Kung Fu Panda",
    year: 2008,
    genre: "Action",
    rating: 7.6,
    director: "Mark Osborne",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/76/Kungfupanda.jpg&w=500",
  },

  {
    id: "78",
    title: "Zootopia",
    year: 2016,
    genre: "Fantasy",
    rating: 8,
    director: "Byron Howard",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/96/Zootopia_%28movie_poster%29.jpg&w=500",
  },

  {
    id: "79",
    title: "Frozen",
    year: 2013,
    genre: "Fantasy",
    rating: 7.4,
    director: "Chris Buck",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/05/Frozen_%282013_film%29_poster.jpg&w=500",
  },

  {
    id: "80",
    title: "The Lion King",
    year: 1994,
    genre: "Fantasy",
    rating: 8.5,
    director: "Roger Allers",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3d/The_Lion_King_poster.jpg&w=500",
  },

  {
    id: "81",
    title: "Aladdin",
    year: 1992,
    genre: "Fantasy",
    rating: 8,
    director: "Ron Clements",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/bd/Aladdin_%281992_Disney_film%29_poster.jpg&w=500",
  },

  {
    id: "82",
    title: "Beauty and the Beast",
    year: 1991,
    genre: "Fantasy",
    rating: 8,
    director: "Gary Trousdale",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/5/5e/Beauty_and_the_Beast_%281991_film%29_poster.jpg&w=500",
  },

  {
    id: "83",
    title: "Toy Story 3",
    year: 2010,
    genre: "Fantasy",
    rating: 8.3,
    director: "Lee Unkrich",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/6/69/Toy_Story_3_poster.jpg&w=500",
  },

  {
    id: "84",
    title: "Harry Potter and the Philosopher's Stone",
    year: 2001,
    genre: "Fantasy",
    rating: 7.6,
    director: "Chris Columbus",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7a/Harry_Potter_and_the_Philosopher%27s_Stone_banner.jpg&w=500",
  },

  {
    id: "85",
    title: "Harry Potter and the Chamber of Secrets",
    year: 2002,
    genre: "Fantasy",
    rating: 7.4,
    director: "Chris Columbus",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/c0/Harry_Potter_and_the_Chamber_of_Secrets_movie.jpg&w=500",
  },

  {
    id: "86",
    title: "Harry Potter and the Prisoner of Azkaban",
    year: 2004,
    genre: "Fantasy",
    rating: 7.9,
    director: "Alfonso Cuarón",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/1/18/Harry_Potter_and_the_Prisoner_of_Azkaban_film_poster.jpg&w=500",
  },

  {
    id: "87",
    title: "Harry Potter and the Goblet of Fire",
    year: 2005,
    genre: "Fantasy",
    rating: 7.7,
    director: "Mike Newell",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/c/c9/Harry_Potter_and_the_Goblet_of_Fire_Poster.jpg&w=500",
  },

  {
    id: "88",
    title: "Harry Potter and the Order of the Phoenix",
    year: 2007,
    genre: "Fantasy",
    rating: 7.5,
    director: "David Yates",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/Harry_Potter_and_the_Order_of_the_Phoenix_poster.jpg&w=500",
  },

  {
    id: "89",
    title: "Harry Potter and the Half-Blood Prince",
    year: 2009,
    genre: "Fantasy",
    rating: 7.6,
    director: "David Yates",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3f/Harry_Potter_and_the_Half-Blood_Prince_poster.jpg&w=500",
  },

  {
    id: "90",
    title: "Harry Potter and the Deathly Hallows – Part 1",
    year: 2010,
    genre: "Fantasy",
    rating: 7.7,
    director: "David Yates",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/2/2d/Harry_Potter_and_the_Deathly_Hallows_%E2%80%93_Part_1.jpg&w=500",
  },

  {
    id: "91",
    title: "Harry Potter and the Deathly Hallows – Part 2",
    year: 2011,
    genre: "Fantasy",
    rating: 8.1,
    director: "David Yates",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/df/Harry_Potter_and_the_Deathly_Hallows_%E2%80%93_Part_2.jpg&w=500",
  },

  {
    id: "92",
    title: "Iron Man",
    year: 2008,
    genre: "Action",
    rating: 7.9,
    director: "Jon Favreau",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/02/Iron_Man_%282008_film%29_poster.jpg&w=500",
  },

  {
    id: "93",
    title: "The Avengers",
    year: 2012,
    genre: "Action",
    rating: 8,
    director: "Joss Whedon",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/8/8a/The_Avengers_%282012_film%29_poster.jpg&w=500",
  },

  {
    id: "94",
    title: "Captain America: The Winter Soldier",
    year: 2014,
    genre: "Action",
    rating: 7.7,
    director: "Anthony and Joe Russo",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/9/9e/Captain_America_The_Winter_Soldier_poster.jpg&w=500",
  },

  {
    id: "95",
    title: "Avengers: Infinity War",
    year: 2018,
    genre: "Action",
    rating: 8.4,
    director: "Anthony and Joe Russo",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4d/Avengers_Infinity_War_poster.jpg&w=500",
  },

  {
    id: "96",
    title: "Avengers: Endgame",
    year: 2019,
    genre: "Action",
    rating: 8.4,
    director: "Anthony and Joe Russo",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg&w=500",
  },

  {
    id: "97",
    title: "Thor: Ragnarok",
    year: 2017,
    genre: "Action",
    rating: 7.9,
    director: "Taika Waititi",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg&w=500",
  },

  {
    id: "98",
    title: "Black Panther",
    year: 2018,
    genre: "Action",
    rating: 7.3,
    director: "Ryan Coogler",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d6/Black_Panther_%28film%29_poster.jpg&w=500",
  },

  {
    id: "99",
    title: "Spider-Man: Homecoming",
    year: 2017,
    genre: "Action",
    rating: 7.4,
    director: "Jon Watts",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/f/f9/Spider-Man_Homecoming_poster.jpg&w=500",
  },

  {
    id: "100",
    title: "Spider-Man: No Way Home",
    year: 2021,
    genre: "Action",
    rating: 8.2,
    director: "Jon Watts",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/00/Spider-Man_No_Way_Home_poster.jpg&w=500",
  },

  {
    id: "101",
    title: "Doctor Strange",
    year: 2016,
    genre: "Action",
    rating: 7.5,
    director: "Scott Derrickson",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a1/Doctor_Strange_%282016_film%29_poster.jpg&w=500",
  },

  {
    id: "102",
    title: "The Empire Strikes Back",
    year: 1980,
    genre: "Sci-Fi",
    rating: 8.7,
    director: "Irvin Kershner",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/3/3f/The_Empire_Strikes_Back_%281980_film%29.jpg&w=500",
  },

  {
    id: "103",
    title: "Return of the Jedi",
    year: 1983,
    genre: "Sci-Fi",
    rating: 8.3,
    director: "Richard Marquand",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/b2/ReturnOfTheJediPoster1983.jpg&w=500",
  },

  {
    id: "104",
    title: "Star Wars: The Force Awakens",
    year: 2015,
    genre: "Sci-Fi",
    rating: 7.8,
    director: "J. J. Abrams",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a2/Star_Wars_The_Force_Awakens_Theatrical_Poster.jpg&w=500",
  },

  {
    id: "105",
    title: "Rogue One",
    year: 2016,
    genre: "Sci-Fi",
    rating: 7.8,
    director: "Gareth Edwards",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/d/d4/Rogue_One%2C_A_Star_Wars_Story_poster.png&w=500",
  },

  {
    id: "106",
    title: "Jurassic Park",
    year: 1993,
    genre: "Sci-Fi",
    rating: 8.2,
    director: "Steven Spielberg",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e7/Jurassic_Park_poster.jpg&w=500",
  },

  {
    id: "107",
    title: "E.T. the Extra-Terrestrial",
    year: 1982,
    genre: "Sci-Fi",
    rating: 7.9,
    director: "Steven Spielberg",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/6/66/E_t_the_extra_terrestrial_ver3.jpg&w=500",
  },

  {
    id: "108",
    title: "Close Encounters of the Third Kind",
    year: 1977,
    genre: "Sci-Fi",
    rating: 7.6,
    director: "Steven Spielberg",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/b/ba/Close_Encounters_of_the_Third_Kind_%281977%29_theatrical_poster.jpg&w=500",
  },

  {
    id: "109",
    title: "Minority Report",
    year: 2002,
    genre: "Sci-Fi",
    rating: 7.6,
    director: "Steven Spielberg",
    poster:
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/44/Minority_Report_Poster.jpg&w=500",
  },

]

export const TRENDING_IDS = ["33", "3", "37", "28", "11", "46"]

export const NEW_RELEASE_IDS = ["33", "34", "35", "3", "7", "15", "39", "40"]

export const GENRES = [
  "All",
  "Drama",
  "Sci-Fi",
  "Romance",
  "Thriller",
  "Horror",
  "Fantasy",
  "Action",
]

export const YEARS = [
  "All",
  "2024",
  "2023",
  "2022",
  "2010s",
  "2000s",
  "Pre-2000",
]

export const RATINGS = ["All", "9+", "8+", "7+"]

// Mock data removed — reviews, replies, polls, leaderboard, and user accounts now come from Supabase

export const POLLS: Poll[] = []

export const LEADERBOARD: LeaderboardRow[] = []

export function seedScreenings(): Screening[] {
  const now = new Date()

  const pad = (n: number) => String(n).padStart(2, "0")

  const mk = (
    i: number,
    offset: number,
    title: string,
    time: string,
    location: string,
    poster: string,
    featured = false,
  ): Screening => {
    const d = new Date(now)

    d.setDate(d.getDate() + offset)

    return {
      id: `s${i}`,
      title,
      time,
      location,
      poster,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      movie_id: null,
      featured,
    }
  }

  return [
    mk(
      1,
      2,
      "Eraserhead (1977)",
      "8:00 PM",
      "The Roxy Cinema, Brooklyn",
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/e8/Eraserhead_poster.jpg&w=500",
      true,
    ),

    mk(
      2,
      5,
      "Mulholland Drive (2001)",
      "7:30 PM",
      "IFC Center, Manhattan",
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/0/0f/Mulholland_Drive_poster.jpg&w=500",
      true,
    ),

    mk(
      3,
      9,
      "2001: A Space Odyssey",
      "9:00 PM",
      "Alamo Drafthouse, LIC",
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/e/ef/2001_A_Space_Odyssey_%281968%29.png&w=500",
      true,
    ),

    mk(
      4,
      16,
      "Possession (1981)",
      "8:30 PM",
      "Metrograph, Lower East Side",
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/4/4b/Possession_1981_poster.jpg&w=500",
    ),

    mk(
      5,
      23,
      "Halloween (1978)",
      "10:00 PM",
      "Nitehawk Cinema, Williamsburg",
      "https://wsrv.nl/?url=https://upload.wikimedia.org/wikipedia/en/a/a5/Halloween_%281978%29_theatrical_poster.jpg&w=500",
    ),
  ]
}

export function seedVault(): Vault {
  return {
    watched: MOVIES.slice(0, 6).map((m) => m.id),

    plantowatch: MOVIES.slice(4, 9).map((m) => m.id),

    favorites: MOVIES.slice(0, 4).map((m) => m.id),
  }
}

// ─── localStorage store ───────────────────────────────────────────────────────

const KEYS = {
  movies: "ac:v2:movies",

  reviews: "ac:v2:reviews",

  threads: "ac:v2:threads",

  userVotes: "ac:v2:uservotes",

  polls: "ac:v2:polls",

  pollVotes: "ac:v2:pollvotes",

  screenings: "ac:v3:screenings",

  vault: "ac:v2:vault",

  following: "ac:v2:following",

  notifications: "ac:v2:notifications",

  announcements: "ac:v2:announcements",

  members: "ac:v2:members",

  movieRatings: "ac:v2:movieratings",
}

function load<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)

    if (raw != null) return JSON.parse(raw) as T
  } catch {
    /* ignore */
  }

  return fallback()
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

function nextId(items: { id: string }[], prefix: string): string {
  const max = items.reduce(
    (acc, x) => Math.max(acc, Number(x.id.replace(prefix, "")) || 0),
    0,
  )

  return `${prefix}${max + 1}`
}

export function mockMovies(): Movie[] {
  return load<Movie[]>(KEYS.movies, () => MOVIES)
}

export function mockReviews(): Review[] {
  return load<Review[]>(KEYS.reviews, () => [])
}

export function mockMovieRatings(): MovieRating[] {
  return load<MovieRating[]>(KEYS.movieRatings, () => [])
}

export function mockThreads(): Record<string, Reply[]> {
  return load<Record<string, Reply[]>>(KEYS.threads, () => ({}))
}

export function mockUserVotes(): Record<string, "up" | "down" | null> {
  return load<Record<string, "up" | "down" | null>>(KEYS.userVotes, () => ({}))
}

export function mockPolls(): Poll[] {
  return load<Poll[]>(KEYS.polls, () => POLLS)
}

export function mockPollVotes(): Record<string, number[]> {
  return load<Record<string, number[]>>(KEYS.pollVotes, () => ({}))
}

export function mockScreenings(): Screening[] {
  return load<Screening[]>(KEYS.screenings, () => seedScreenings())
}

export function mockVault(): Vault {
  return load<Vault>(KEYS.vault, () => seedVault())
}

export function mockFollowing(): string[] {
  return load<string[]>(KEYS.following, () => [])
}

function seedMembers(): Profile[] {
  return LEADERBOARD.map((m, i) => ({
    id: `u${i + 1}`,
    username: m.username,
    role: (i === 0 ? "admin" : "member") as Profile["role"],
    avatar_url: null,
  }))
}

export function mockMembers(): Profile[] {
  return load<Profile[]>(KEYS.members, () => seedMembers())
}

function seedNotifications(): Notification[] {
  const h = (n: number) => new Date(Date.now() - n * 3600000).toISOString()

  return [
    {
      id: "n1",
      type: "reply",
      body: "FilmNoir88 replied to your review of Past Lives",
      link: "r2",
      read: false,
      created_at: h(3),
    },

    {
      id: "n2",
      type: "follow",
      body: "ReelTalk started following you",
      link: null,
      read: false,
      created_at: h(26),
    },

    {
      id: "n3",
      type: "reply",
      body: "SunsetBoulevard replied to your review of Spider-Man: Across the Spider-Verse",
      link: "r4",
      read: true,
      created_at: h(50),
    },
  ]
}

export function mockNotifications(): Notification[] {
  return load<Notification[]>(KEYS.notifications, () => seedNotifications())
}

export function mockMarkNotificationsRead(): void {
  save(
    KEYS.notifications,
    mockNotifications().map((n) => ({ ...n, read: true })),
  )
}

function seedAnnouncements(): Announcement[] {
  return [
    {
      id: "a1",
      title: "Welcome to Absolute Cinema",
      body: "Screenings resume this Friday at 8pm — bring a friend.",
      author: "CinemaVault",
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },

    {
      id: "a2",
      title: "November slate is live",
      body: "Polls close Sunday night. Vote for what we watch next month.",
      author: "CinemaVault",
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
  ]
}

export function mockAnnouncements(): Announcement[] {
  return load<Announcement[]>(KEYS.announcements, () => seedAnnouncements())
}

// ─── Mutations (mirror the old prototype handlers) ────────────────────────────

export function mockVoteReview(id: string, dir: "up" | "down") {
  const votes = mockUserVotes()

  votes[id] = votes[id] === dir ? null : dir

  save(KEYS.userVotes, votes)
}

export function mockAddReply(reviewId: string, body: string) {
  const threads = mockThreads()

  const list = threads[reviewId] ?? []

  const reply: Reply = {
    id: nextId(list, "c"),

    review_id: reviewId,

    username: MOCK_USER.username,

    body,

    created_at: new Date().toISOString(),
  }

  threads[reviewId] = [...list, reply]

  save(KEYS.threads, threads)
}

export function mockCreateReview(input: {
  movie_id: string
  rating: number
  body: string
  tags: ReviewTag[]
}): Review {
  const reviews = mockReviews()

  const review: Review = {
    id: nextId(reviews, "r"),

    movie_id: input.movie_id,

    author_id: MOCK_USER.id,

    username: MOCK_USER.username,

    rating: input.rating,

    body: input.body,

    tags: input.tags,

    upvotes: 0,

    downvotes: 0,

    created_at: new Date().toISOString(),

    featured: false,
  }

  save(KEYS.reviews, [review, ...reviews])

  return review
}

export function mockCastPollVote(pollId: string, idx: number, multiple: boolean) {
  const votes = mockPollVotes()

  const cur = votes[pollId] ?? []

  if (!multiple) {
    votes[pollId] = [idx]
  } else {
    votes[pollId] = cur.includes(idx)
      ? cur.filter((i) => i !== idx)
      : [...cur, idx]
  }

  save(KEYS.pollVotes, votes)
}

export function mockToggleFavorite(movieId: string) {
  const vault = mockVault()

  const has = vault.favorites.includes(movieId)

  vault.favorites = has
    ? vault.favorites.filter((x) => x !== movieId)
    : [...vault.favorites, movieId]

  save(KEYS.vault, vault)
}

export function mockSetVaultStatus(movieId: string, status: VaultTab) {
  const vault = mockVault()

  const has = vault[status].includes(movieId)

  vault[status] = has
    ? vault[status].filter((x) => x !== movieId)
    : [...vault[status], movieId]

  save(KEYS.vault, vault)
}

export function mockRateMovie(movieId: string, rating: number) {
  const ratings = mockMovieRatings()

  const i = ratings.findIndex(
    (r) => r.movie_id === movieId && r.user_id === MOCK_USER.id,
  )

  if (i >= 0) {
    ratings[i] = { ...ratings[i], rating }
  } else {
    ratings.push({
      id: nextId(ratings, "mr"),
      movie_id: movieId,
      user_id: MOCK_USER.id,
      rating,
    })
  }

  save(KEYS.movieRatings, ratings)
}

export function mockToggleFollow(userId: string) {
  const following = mockFollowing()

  save(
    KEYS.following,
    following.includes(userId)
      ? following.filter((x) => x !== userId)
      : [...following, userId],
  )
}

export function mockAddScreening(input: Omit<Screening, "id">): Screening {
  const screenings = mockScreenings()

  const screening: Screening = { ...input, id: nextId(screenings, "s") }

  save(KEYS.screenings, [...screenings, screening])

  return screening
}

export function mockDeleteScreening(id: string) {
  save(
    KEYS.screenings,
    mockScreenings().filter((x) => x.id !== id),
  )
}

export function mockToggleScreeningFeatured(id: string) {
  const screenings = mockScreenings()
  save(
    KEYS.screenings,
    screenings.map((s) => (s.id === id ? { ...s, featured: !s.featured } : s)),
  )
}

export function mockAddPoll(input: {
  question: string
  closes: string
  options: string[]
  multiple: boolean
}): Poll {
  const polls = mockPolls()

  const poll: Poll = {
    id: nextId(polls, "p"),

    question: input.question,

    closes: input.closes || "TBD",

    status: "open",

    multiple: input.multiple,

    options: input.options.map((label, i) => ({
      id: `${nextId(polls, "p")}o${i + 1}`,
      label,
      votes: 0,
    })),
  }

  save(KEYS.polls, [...polls, poll])

  return poll
}

export function mockTogglePoll(id: string) {
  save(
    KEYS.polls,
    mockPolls().map((p) =>
      p.id === id
        ? { ...p, status: p.status === "open" ? "closed" : "open" }
        : p,
    ),
  )
}

export function mockDeletePoll(id: string) {
  save(
    KEYS.polls,
    mockPolls().filter((p) => p.id !== id),
  )
}

export function mockDeleteReview(id: string) {
  save(
    KEYS.reviews,
    mockReviews().filter((r) => r.id !== id),
  )
}

export function mockUpdateReview(
  id: string,
  input: { movie_id: string; rating: number; body: string; tags: ReviewTag[] },
) {
  save(
    KEYS.reviews,
    mockReviews().map((r) =>
      r.id === id
        ? { ...r, movie_id: input.movie_id, rating: input.rating, body: input.body, tags: input.tags }
        : r,
    ),
  )
}

export function mockAddMovie(input: {
  title: string
  year: number
  genre: string
  rating: number
  director: string
  poster: string
}): Movie {
  const movies = mockMovies()

  const movie: Movie = { id: `m${Date.now()}`, ...input }

  save(KEYS.movies, [movie, ...movies])

  return movie
}

export function mockDeleteMovie(id: string) {
  save(
    KEYS.movies,
    mockMovies().map((m) =>
      m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m,
    ),
  )
}

export function mockRestoreMovie(id: string) {
  save(
    KEYS.movies,
    mockMovies().map((m) => (m.id === id ? { ...m, deleted_at: null } : m)),
  )
}

export function mockDeleteComment(id: string) {
  const threads = mockThreads()

  for (const key of Object.keys(threads)) {
    threads[key] = threads[key].filter((c) => c.id !== id)
  }

  save(KEYS.threads, threads)
}

export function mockAddAnnouncement(input: {
  title: string
  body: string
}): Announcement {
  const anns = mockAnnouncements()

  const a: Announcement = {
    id: `a${Date.now()}`,
    title: input.title,
    body: input.body,
    author: MOCK_USER.username,
    created_at: new Date().toISOString(),
  }

  save(KEYS.announcements, [a, ...anns])

  return a
}

export function mockDeleteAnnouncement(id: string) {
  save(
    KEYS.announcements,
    mockAnnouncements().filter((a) => a.id !== id),
  )
}

export function mockSetMemberRole(userId: string, role: "member" | "admin") {
  save(
    KEYS.members,
    mockMembers().map((m) => (m.id === userId ? { ...m, role } : m)),
  )
}

export function mockSetReviewFeatured(reviewId: string, featured: boolean, backgroundUrl?: string) {
  save(
    KEYS.reviews,
    mockReviews().map((r) => (r.id === reviewId ? { ...r, featured, background_url: backgroundUrl } : r)),
  )
}

export function mockUpdateUsername(username: string) {
  const m = mockMembers().map((x) =>
    x.id === MOCK_USER.id ? { ...x, username } : x,
  )

  save(KEYS.members, m)
}
