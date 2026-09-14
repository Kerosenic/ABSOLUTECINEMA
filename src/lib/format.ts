// Display helpers shared across the UI.

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** Two-letter initials for an avatar, e.g. "CinemaVault" -> "CV". */
export function initials(username: string): string {
  const parts = username
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Relative time from an ISO timestamp, e.g. "2d ago". */
export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (d < 30) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

/** Club rank badge derived from review count. */
export function badgeFor(reviews: number): string {
  if (reviews >= 140) return "Auteur";
  if (reviews >= 120) return "Cinematheque";
  if (reviews >= 90) return "Projectionist";
  if (reviews >= 70) return "Critic";
  return "Reviewer";
}

export function fmtCloses(c: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(c)) {
    const d = new Date(c + "T00:00:00");
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  }
  return c;
}

export function fmtDate(date: string): { day: number; month: string } {
  const d = new Date(date + "T00:00:00");
  return { day: d.getDate(), month: MONTH_ABBR[d.getMonth()] };
}
