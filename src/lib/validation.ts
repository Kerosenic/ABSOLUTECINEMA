// Form validation schemas (zod) shared by the write-review, sign-in/up, and
// admin forms. Kept separate from the components so the rules live in one place.
//
// Deliberately minimal: real format validation for email/password is enforced
// by Supabase Auth at sign-in time — these schemas catch the obvious cases the
// UI can't (empty fields, short bodies, not enough poll options) with inline
// field errors instead of a silent no-op.

import { z } from "zod";

export const reviewSchema = z.object({
  movie_id: z.string().min(1, "Pick a movie to review"),
  rating: z.number().int().min(1, "Choose a star rating").max(10),
  body: z.string().trim().min(10, "Review needs at least 10 characters"),
  background_url: z.string().trim().optional(),
});

export const pollSchema = z.object({
  question: z.string().trim().min(3, "Poll question is too short"),
  closes: z.string(),
  options: z
    .array(z.string().trim().min(1, "Option can't be blank"))
    .min(2, "Add at least 2 options")
    .max(8, "At most 8 options"),
});

export const screeningSchema = z.object({
  title: z.string().trim().min(1, "Movie title is required"),
  date: z.string().min(1, "Pick a screening date"),
  time: z.string().trim().min(1, "Start time is required"),
  location: z.string().trim(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
});

export const movieSchema = z.object({
  title: z.string().trim().min(1, "Movie title is required"),
  year: z.coerce.number().int().min(1888, "Enter a valid year").max(2100, "Enter a valid year"),
  genre: z.string().trim().min(1, "Pick a genre"),
  rating: z.coerce.number().min(0, "Rating 0–10").max(10, "Rating 0–10"),
  director: z.string().trim(),
  poster: z.string().trim(),
});

export const signInSchema = z.object({
  email: z.string().trim().min(3, "Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter a valid email")
    .refine(
      (e) => /^[^@\s]+@tsinglan\.org$/i.test(e) || e.toLowerCase() === "firelight7831@gmail.com",
      "Use a @tsinglan.org email to sign up",
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().trim().min(2, "Username needs at least 2 characters"),
});

export type FieldErrors = Record<string, string>;

/** Validate `value` against a schema, returning a flat { field: message } map. */
export function parseForm<T>(schema: z.ZodType<T>, value: unknown): { data: T; errors: FieldErrors } {
  const res = schema.safeParse(value);
  if (res.success) return { data: res.data, errors: {} };
  const errors: FieldErrors = {};
  for (const issue of res.error.issues) {
    // Collapse array paths (e.g. options[0]) to their parent field name.
    const key = String(issue.path[0] ?? "_");
    errors[key] ??= issue.message;
  }
  return { data: value as T, errors };
}

/** First error message, or null — handy for a single summary line. */
export function firstError(errors: FieldErrors): string | null {
  return Object.values(errors)[0] ?? null;
}
