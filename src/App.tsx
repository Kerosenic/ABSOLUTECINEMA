import { useState, useCallback, useEffect, useRef } from "react";
import type { Movie, Review, Reply, Poll, Screening, VaultTab, LeaderboardRow, Profile, Session } from "./lib/types";
import { initials, timeAgo, badgeFor, fmtCloses, fmtDate, MONTH_NAMES } from "./lib/format";
import { isSupabaseConfigured } from "./lib/supabase";
import { GENRES, YEARS, RATINGS, TRENDING_IDS } from "./lib/mock";
import {
  useInitAuth, useSession, useAuth,
  useMovies, useReviews, useThreads, usePolls, useScreenings, useLeaderboard, useMembers,
  useVault, useFollowing, useMyReviewVotes, useMyPollVotes,
  useCreateReview, useVoteReview, useAddReply, useCastPollVote, useToggleFavorite,
  useToggleFollow, useAddScreening, useDeleteScreening, useAddPoll, useTogglePoll,
  useDeletePoll, useDeleteReview,
} from "./lib/queries";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "calendar" | "leaderboard" | "profile" | "admin";

// ─── Persistent state ─────────────────────────────────────────────────────────
function usePersistentState<T>(key: string, makeInitial: () => T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch { /* ignore */ }
    return makeInitial();
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ }
  }, [key, state]);
  return [state, setState] as const;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastMsg = { id: number; text: string; type: "success" | "info" };

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="px-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xl text-sm font-medium text-[var(--foreground)] flex items-center gap-2 animate-fade-in">
          {t.type === "success" && <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);
  const push = useCallback((text: string, type: ToastMsg["type"] = "success") => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);
  return { toasts, push };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function StarRating({ rating, max = 10 }: { rating: number; max?: number }) {
  const filled = Math.round((rating / max) * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 transition-colors ${i < filled ? "text-[var(--star)]" : "text-[var(--border)]"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <button key={i} onClick={() => onChange(i + 1)} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)}
          className={`text-lg transition-all ${i < (hover || value) ? "text-[var(--star)] scale-110" : "text-[var(--border)]"}`}>★</button>
      ))}
    </div>
  );
}

function Avt({ initials: text, size = "md", color }: { initials: string; size?: "xs" | "sm" | "md" | "lg"; color?: string }) {
  const s = { xs: "w-6 h-6 text-[10px]", sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];
  const bg = color || "from-[var(--accent)] to-[var(--primary)]";
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center font-display font-bold text-[var(--accent-foreground)] flex-shrink-0`}>
      {text}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  const map: Record<string, string> = {
    Auteur:        "bg-amber-500/15 text-amber-400 border-amber-500/25",
    Cinematheque:  "bg-purple-500/15 text-purple-400 border-purple-500/25",
    Projectionist: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    Critic:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    Reviewer:      "bg-[var(--border)]/40 text-[var(--muted-foreground)] border-[var(--border)]",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${map[label] || map.Reviewer}`}>{label}</span>;
}

function SectionHeader({ label, pre, action, onAction }: { label: string; pre?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-end gap-4 mb-7">
      <div>
        {pre && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">{pre}</p>}
        <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">{label}</h2>
      </div>
      <span className="flex-1 h-px bg-[var(--border)] mb-2" />
      {action && <button onClick={onAction} className="text-sm text-[var(--accent)] font-semibold hover:opacity-70 transition-opacity whitespace-nowrap mb-1">{action} →</button>}
    </div>
  );
}

// ─── Sign In Modal ────────────────────────────────────────────────────────────
function SignInModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

  const submit = async () => {
    if (!email || !pass) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        await auth.signIn(email, pass);
        onClose();
      } else {
        const s = await auth.signUp(email, pass, username);
        if (s) onClose();
        else setError("Account created — check your email to confirm, then sign in.");
      }
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded bg-[var(--accent)] flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--accent-foreground)]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
          </div>
          <span className="font-display font-800 text-base tracking-wide text-[var(--foreground)]">ABSOLUTE CINEMA</span>
        </div>

        <h2 className="font-display font-900 text-3xl text-[var(--foreground)] mb-1">{mode === "signin" ? "WELCOME BACK" : "JOIN THE CLUB"}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">{mode === "signin" ? "Sign in to your account" : "Create your free account"}</p>

        <div className="flex flex-col gap-3 mb-5">
          {mode === "signup" && (
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Password" className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
        </div>

        {error && <p className="text-xs text-[var(--accent)] mb-4">{error}</p>}

        <button onClick={submit} disabled={busy || !email || !pass} className="btn-parallelogram w-full py-3 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity text-sm tracking-wide disabled:opacity-40">
          {busy ? "PLEASE WAIT…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>

        {isSupabaseConfigured && (
          <button onClick={() => auth.signInGoogle()} className="w-full py-2.5 mt-3 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--foreground)] hover:border-[var(--accent)] transition-colors">
            Continue with Google
          </button>
        )}

        <p className="text-xs text-center text-[var(--muted-foreground)] mt-4">
          {mode === "signin" ? "New here?" : "Already a member?"}{" "}
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className="text-[var(--accent)] font-semibold hover:opacity-80">
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function NavBar({ page, setPage, dark, setDark, session, isAdmin, onSignIn, onSignOut }: {
  page: Page; setPage: (p: Page) => void; dark: boolean; setDark: (v: boolean) => void;
  session: Session | null; isAdmin: boolean; onSignIn: () => void; onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navTo = (id: string) => {
    if (["reviews", "polls", "library"].includes(id)) {
      setPage("home");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } else {
      setPage(id as Page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Home",        id: "home" },
    { label: "Reviews",     id: "reviews" },
    { label: "Polls",       id: "polls" },
    { label: "Movies",      id: "library" },
    { label: "Calendar",    id: "calendar" },
    { label: "Leaderboard", id: "leaderboard" },
    ...(isAdmin ? [{ label: "Admin", id: "admin" }] : []),
  ];

  const isActive = (id: string) => {
    if (id === "home" && page === "home") return true;
    if (id === page) return true;
    return false;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[var(--background)]/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-[var(--border)]" : "bg-gradient-to-b from-[var(--background)]/80 to-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <button onClick={() => navTo("home")} className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4 text-[var(--accent-foreground)]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
          </div>
          <span className="font-display font-900 text-base tracking-widest text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">ABSOLUTE CINEMA</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {navLinks.map((l) => (
            <button key={l.id} onClick={() => navTo(l.id)} className={`relative text-sm font-medium transition-colors py-1 ${isActive(l.id) ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
              {l.label}
              {isActive(l.id) && <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setDark(!dark)} title={dark ? "Switch to light mode" : "Switch to dark mode"} className="relative w-11 h-6 rounded-full border border-[var(--border)] bg-[var(--muted)] transition-colors hover:border-[var(--accent)]/50">
            <span className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${dark ? "left-0.5 bg-[var(--muted-foreground)]" : "left-5 bg-[var(--accent)]"}`}>
              {dark ? (
                <svg className="w-3 h-3 text-[var(--background)]" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
              ) : (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
              )}
            </span>
          </button>
          {session ? (
            <>
              <button onClick={() => navTo("profile")} className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                <Avt initials={initials(session.user.username)} size="xs" />
                <span className="font-medium">{session.user.username}</span>
              </button>
              <button onClick={onSignOut} className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">SIGN OUT</button>
            </>
          ) : (
            <button onClick={onSignIn} className="btn-parallelogram px-4 py-1.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity tracking-wide">
              SIGN IN
            </button>
          )}
        </div>

        {/* Mobile right */}
        <div className="lg:hidden flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="relative w-10 h-5 rounded-full border border-[var(--border)] bg-[var(--muted)]">
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--accent)] transition-all duration-300 ${dark ? "left-0.5" : "left-5"}`} />
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 text-[var(--foreground)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)]/98 backdrop-blur-lg px-4 py-5 flex flex-col gap-1">
          {navLinks.map((l) => (
            <button key={l.id} onClick={() => navTo(l.id)} className={`text-sm font-medium py-2 text-left transition-colors ${isActive(l.id) ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>{l.label}</button>
          ))}
          <div className="border-t border-[var(--border)] pt-3 mt-2">
            {session ? (
              <button onClick={() => { onSignOut(); setMenuOpen(false); }} className="btn-parallelogram w-full py-2.5 bg-[var(--muted)] text-[var(--foreground)] text-sm font-bold">SIGN OUT</button>
            ) : (
              <button onClick={() => { onSignIn(); setMenuOpen(false); }} className="btn-parallelogram w-full py-2.5 bg-[var(--accent)] text-black text-sm font-bold">SIGN IN</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ movies, reviews }: { movies: Movie[]; reviews: Review[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const featured = [reviews[3], reviews[5], reviews[0]].filter((r): r is Review => Boolean(r));

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  if (featured.length === 0) return null;
  const review = featured[Math.min(activeIdx, featured.length - 1)];
  const movie = movies.find((m) => m.id === review.movie_id);
  if (!movie) return null;

  const heroImages = [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1600&h=900&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&h=900&fit=crop&auto=format",
  ];

  return (
    <div className="relative h-[88vh] min-h-[560px] overflow-hidden">
      {heroImages.map((src, i) => (
        <img key={i} src={src} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === activeIdx ? "opacity-100" : "opacity-0"}`} />
      ))}

      {/* Layered gradients for cinematic look */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)]/30" />
      <div className="absolute inset-0 bg-[var(--background)]/20" />

      {/* Film grain overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Featured Review</span>
            <span className="w-6 h-px bg-[var(--accent)]" />
            <span className="text-xs text-[var(--muted-foreground)]">{movie.year} · {movie.genre}</span>
          </div>
          <h1 className="font-display font-900 text-[clamp(3rem,10vw,6rem)] leading-[0.9] tracking-tight text-[var(--foreground)] mb-4 uppercase">
            {movie.title}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={review.rating} />
            <span className="font-display font-900 text-3xl text-[var(--accent)] leading-none">{review.rating}<span className="text-sm font-400 text-[var(--muted-foreground)]">/10</span></span>
            <span className="text-sm text-[var(--muted-foreground)]">by <span className="text-[var(--foreground)] font-medium">{review.username}</span></span>
          </div>
          <p className="text-[var(--secondary-foreground)] text-sm sm:text-base leading-relaxed mb-7 max-w-md line-clamp-3">{review.body}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })} className="btn-parallelogram px-6 py-2.5 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-all hover:scale-[1.02] text-sm tracking-wide">
              READ REVIEW
            </button>
            <button onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })} className="btn-parallelogram px-6 py-2.5 border border-[var(--foreground)]/20 text-[var(--foreground)] font-semibold hover:border-[var(--foreground)]/50 transition-colors text-sm backdrop-blur-sm">
              ALL REVIEWS
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-8">
          {featured.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} className={`h-0.5 transition-all rounded-full ${i === activeIdx ? "w-8 bg-[var(--accent)]" : "w-3 bg-[var(--foreground)]/30 hover:bg-[var(--foreground)]/50"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Horizontal Movie Row ─────────────────────────────────────────────────────
function MovieRow({ title, pre, movieIds, movies, favorites, onToggleFavorite }: { title: string; pre: string; movieIds: string[]; movies: Movie[]; favorites: string[]; onToggleFavorite: (id: string) => void }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rowMovies = movieIds.map((id) => movies.find((m) => m.id === id)).filter((m): m is Movie => Boolean(m));

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  };

  return (
    <div className="relative group/row">
      <SectionHeader label={title} pre={pre} />
      <div className="relative">
        <button onClick={() => scroll("left")} className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-[var(--background)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-start pl-1">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div ref={rowRef} className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {rowMovies.map((movie) => (
            <RowCard key={movie.id} movie={movie} saved={favorites.includes(movie.id)} onToggle={() => onToggleFavorite(movie.id)} />
          ))}
        </div>
        <button onClick={() => scroll("right")} className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-[var(--background)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-end pr-1">
          <svg className="w-5 h-5 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

function RowCard({ movie, saved, onToggle }: { movie: Movie; saved: boolean; onToggle: () => void }) {
  return (
    <div className="group flex-shrink-0 w-32 sm:w-36 cursor-pointer">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] mb-2">
        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[var(--star)]">★ {movie.rating}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${saved ? "bg-[var(--accent)] text-black" : "bg-black/50 text-white hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}>
              <svg className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
          </div>
        </div>
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white font-medium">{movie.genre}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-[var(--foreground)] truncate leading-tight">{movie.title}</p>
      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{movie.year}</p>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, replies, userVote, onVote, onReply, movies }: {
  review: Review; replies: Reply[]; userVote: "up" | "down" | null; onVote: (id: string, dir: "up" | "down") => void; onReply: (id: string, body: string) => void; movies: Movie[];
}) {
  const movie = movies.find((m) => m.id === review.movie_id);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const up = review.upvotes + (userVote === "up" ? 1 : 0);
  const down = review.downvotes + (userVote === "down" ? 1 : 0);

  if (!movie) return null;

  const submitReply = () => {
    if (!replyText.trim()) return;
    onReply(review.id, replyText.trim());
    setReplyText("");
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 flex flex-col">
      <div className="flex gap-4 p-4 pb-3">
        <div className="relative flex-shrink-0">
          <img src={movie.poster} alt={movie.title} className="w-[72px] h-[100px] object-cover rounded-xl bg-[var(--muted)]" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent)] border-2 border-[var(--card)] flex items-center justify-center shadow">
            <span className="text-xs font-display font-900 text-[var(--accent-foreground)] leading-none">{review.rating}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-display font-800 text-base text-[var(--foreground)] leading-tight truncate">{movie.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)]">{movie.year} · {movie.director}</p>
            </div>
            <div className="flex-shrink-0"><StarRating rating={review.rating} /></div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Avt initials={initials(review.username)} size="xs" />
            <span className="text-xs text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)] font-semibold">{review.username}</span> · {timeAgo(review.created_at)}
            </span>
          </div>
          <p className="text-sm text-[var(--secondary-foreground)] leading-relaxed line-clamp-2">{review.body}</p>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-[var(--border)] mt-auto">
        <button onClick={() => onVote(review.id, "up")} className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 ${userVote === "up" ? "text-[var(--accent)]" : "text-[var(--muted-foreground)] hover:text-[var(--accent)]"}`}>
          <svg className="w-4 h-4" fill={userVote === "up" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          {up}
        </button>
        <button onClick={() => onVote(review.id, "down")} className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 ${userVote === "down" ? "text-blue-400" : "text-[var(--muted-foreground)] hover:text-blue-400"}`}>
          <svg className="w-4 h-4" fill={userVote === "down" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          {down}
        </button>
        <button onClick={() => setShowReplies(!showReplies)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ml-auto ${showReplies ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      {showReplies && (
        <div className="border-t border-[var(--border)] px-4 pt-3 pb-4 flex flex-col gap-3 bg-[var(--muted)]/40">
          {replies.map((r) => (
            <div key={r.id} className="flex gap-2.5 items-start">
              <Avt initials={initials(r.username)} size="xs" />
              <div className="flex-1 bg-[var(--card)] rounded-xl px-3 py-2 border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--foreground)] mb-0.5">{r.username}</p>
                <p className="text-xs text-[var(--secondary-foreground)] leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
          {replies.length === 0 && <p className="text-xs text-[var(--muted-foreground)] text-center py-2">No replies yet. Be first!</p>}
          <div className="flex gap-2 items-center">
            <Avt initials="ME" size="xs" />
            <div className="flex-1 flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitReply(); }} placeholder="Write a reply…" className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
              <button onClick={submitReply} className="px-3 py-1.5 bg-[var(--accent)] text-black text-xs font-bold rounded-full hover:opacity-90 transition-opacity">Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Write Review Modal ───────────────────────────────────────────────────────
function WriteReviewModal({ onClose, onSubmit, movies }: { onClose: () => void; onSubmit: (movieId: string, rating: number, body: string) => void; movies: Movie[] }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [movieId, setMovieId] = useState("");

  const submit = () => {
    if (!movieId || !rating || !body.trim()) return;
    onSubmit(movieId, rating, body.trim());
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="font-display font-900 text-2xl text-[var(--foreground)] mb-5">WRITE A REVIEW</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Movie</label>
            <select value={movieId} onChange={(e) => setMovieId(e.target.value)} className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors">
              <option value="">Select a movie…</option>
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.year})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Your Rating</label>
            <div className="flex items-center gap-3">
              <InteractiveStars value={rating} onChange={setRating} />
              {rating > 0 && <span className="text-sm font-bold text-[var(--accent)]">{rating}/10</span>}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">Review</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What did you think?" className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors resize-none" />
          </div>
          <button onClick={submit} disabled={!movieId || !rating || !body.trim()} className="btn-parallelogram w-full py-3 bg-[var(--accent)] text-black font-bold transition-all text-sm tracking-wide disabled:opacity-40 hover:opacity-90">
            PUBLISH REVIEW
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────
function PollCard({ poll, myVote, onVote }: { poll: Poll; myVote: number | null; onVote: (pollId: string, idx: number) => void }) {
  const closed = poll.status === "closed";
  const optVotes = poll.options.map((o, i) => o.votes + (myVote === i ? 1 : 0));
  const total = optVotes.reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...optVotes);

  const castVote = (i: number) => {
    if (myVote !== null || closed) return;
    onVote(poll.id, i);
  };

  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/25 transition-all ${closed ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">Admin Poll</p>
          <h3 className="font-display font-800 text-xl text-[var(--foreground)] leading-tight">{poll.question}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[var(--muted-foreground)]">{closed ? "Status" : "Closes"}</p>
          <p className={`text-sm font-bold ${closed ? "text-[var(--muted-foreground)]" : "text-[var(--foreground)]"}`}>{closed ? "Closed" : fmtCloses(poll.closes)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((optVotes[i] / total) * 100) : 0;
          const isWinner = myVote !== null && optVotes[i] === maxVotes;
          const isVoted = myVote === i;
          return (
            <button key={opt.id} onClick={() => castVote(i)} disabled={myVote !== null || closed} className={`relative w-full text-left rounded-xl overflow-hidden border transition-all duration-200 ${isVoted ? "border-[var(--accent)] bg-[var(--accent)]/5" : myVote !== null || closed ? "border-[var(--border)] cursor-default" : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--muted)]"}`}>
              {myVote !== null && (
                <div className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${isWinner ? "bg-[var(--accent)]/15" : "bg-[var(--muted)]"}`} style={{ width: `${pct}%` }} />
              )}
              <div className="relative flex items-center gap-3 px-4 py-3">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isVoted ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"}`}>
                  {isVoted && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-foreground)]" />}
                </div>
                <span className={`text-sm flex-1 font-medium ${isVoted ? "text-[var(--accent)]" : isWinner && myVote !== null ? "text-[var(--foreground)] font-bold" : "text-[var(--foreground)]"}`}>{opt.label}</span>
                {myVote !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums text-[var(--muted-foreground)]">{pct}%</span>
                    {isWinner && <svg className="w-3.5 h-3.5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-3">{total.toLocaleString()} votes · {closed ? "Voting closed" : myVote === null ? "Cast your vote" : "Results shown"}</p>
    </div>
  );
}

// ─── Library Card ─────────────────────────────────────────────────────────────
function LibCard({ movie, saved, onToggle }: { movie: Movie; saved: boolean; onToggle: () => void }) {
  return (
    <div className="group relative cursor-pointer">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] relative">
        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-xs font-bold leading-tight">{movie.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[var(--star)] text-xs font-bold">★ {movie.rating}</span>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${saved ? "bg-[var(--accent)]" : "bg-white/10 hover:bg-[var(--accent)]"}`}>
              <svg className="w-3 h-3 text-white" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </button>
          </div>
        </div>
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white font-medium">{movie.genre}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ movies, reviews, threads, userVotes, onVote, onReply, polls, pollVotes, onPollVote, favorites, onToggleFavorite, onWriteReview }: {
  movies: Movie[]; reviews: Review[]; threads: Record<string, Reply[]>; userVotes: Record<string, "up" | "down" | null>; onVote: (id: string, dir: "up" | "down") => void; onReply: (id: string, body: string) => void;
  polls: Poll[]; pollVotes: Record<string, number>; onPollVote: (pollId: string, idx: number) => void;
  favorites: string[]; onToggleFavorite: (id: string) => void; onWriteReview: (movieId: string, rating: number, body: string) => void;
}) {
  const [genre, setGenre] = useState("All");
  const [year, setYear] = useState("All");
  const [rating, setRating] = useState("All");
  const [query, setQuery] = useState("");
  const [showWriteReview, setShowWriteReview] = useState(false);

  const filtered = movies.filter((m) => {
    if (genre !== "All" && m.genre !== genre) return false;
    if (year !== "All") {
      if (year === "Pre-2000" && m.year >= 2000) return false;
      if (year === "2000s" && (m.year < 2000 || m.year >= 2010)) return false;
      if (year === "2010s" && (m.year < 2010 || m.year >= 2020)) return false;
      if (!isNaN(Number(year)) && m.year !== Number(year)) return false;
    }
    if (rating !== "All" && m.rating < parseFloat(rating)) return false;
    if (query && !m.title.toLowerCase().includes(query.toLowerCase()) && !m.director.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      {showWriteReview && <WriteReviewModal onClose={() => setShowWriteReview(false)} onSubmit={(movieId, rating, body) => { onWriteReview(movieId, rating, body); setShowWriteReview(false); }} movies={movies} />}

      <HeroBanner movies={movies} reviews={reviews} />

      {/* Trending Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <MovieRow title="WATCHING NEXT..." pre="Now Showing" movieIds={TRENDING_IDS} movies={movies} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      </section>

      {/* Latest Reviews */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end gap-4 mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">Member Writing</p>
            <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">LATEST REVIEWS</h2>
          </div>
          <span className="flex-1 h-px bg-[var(--border)] mb-2" />
          <button onClick={() => setShowWriteReview(true)} className="btn-parallelogram mb-1 flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Write Review
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} replies={threads[r.id] || []} userVote={userVotes[r.id] ?? null} onVote={onVote} onReply={onReply} movies={movies} />)}
        </div>
      </section>

      {/* Polls */}
      <section id="polls" className="border-y border-[var(--border)] bg-[var(--muted)]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeader label="MOVIE POLLS" pre="Vote Now" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {polls.map((p) => <PollCard key={p.id} poll={p} myVote={pollVotes[p.id] ?? null} onVote={onPollVote} />)}
          </div>
        </div>
      </section>

      {/* Library */}
      <section id="library" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <SectionHeader label="MOVIE LIBRARY" pre="Explore" />
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or director…" className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
          {[{ opts: GENRES, val: genre, set: setGenre, ph: "Genre" }, { opts: YEARS, val: year, set: setYear, ph: "Year" }, { opts: RATINGS, val: rating, set: setRating, ph: "Rating" }].map(({ opts, val, set, ph }) => (
            <select key={ph} value={val} onChange={(e) => set(e.target.value)} className="px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer">
              <option value="All">{ph}: All</option>
              {opts.slice(1).map((o) => <option key={o} value={o.replace("+", "")}>{ph}: {o}</option>)}
            </select>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filtered.map((m) => <LibCard key={m.id} movie={m} saved={favorites.includes(m.id)} onToggle={() => onToggleFavorite(m.id)} />)}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="font-display font-900 text-3xl text-[var(--muted-foreground)]">NO RESULTS</p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Calendar Page ────────────────────────────────────────────────────────────
function CalendarPage({ screenings, push }: { screenings: Screening[]; push: (t: string) => void }) {
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<number | null>(null);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const dayOf = (date: string) => new Date(date + "T00:00:00").getDate();

  const inMonth = screenings
    .filter((s) => {
      const d = new Date(s.date + "T00:00:00");
      return d.getFullYear() === view.y && d.getMonth() === view.m;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const eventByDay: Record<number, Screening[]> = {};
  inMonth.forEach((s) => {
    const day = dayOf(s.date);
    (eventByDay[day] ||= []).push(s);
  });

  const selectedEvent = selected !== null ? inMonth.find((s) => dayOf(s.date) === selected) ?? null : null;

  const isToday = (day: number) => view.y === today.getFullYear() && view.m === today.getMonth() && day === today.getDate();

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
    setSelected(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">Screening Calendar</p>
          <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">{MONTH_NAMES[view.m]} {view.y}</h2>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--accent)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => { setView({ y: today.getFullYear(), m: today.getMonth() }); setSelected(null); }} className="px-3 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)] transition-colors">TODAY</button>
          <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--accent)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="grid grid-cols-7 mb-1">
            {days.map((d) => <div key={d} className="text-center text-[11px] font-bold text-[var(--muted-foreground)] py-2 uppercase tracking-wider">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const events = day ? eventByDay[day] || [] : [];
              const isSelected = day === selected;
              const todayCell = day ? isToday(day) : false;
              return (
                <button key={i} onClick={() => day && setSelected(isSelected ? null : day)} disabled={!day}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${!day ? "cursor-default" : ""} ${isSelected ? "bg-[var(--accent)] text-black scale-[1.05] shadow-lg" : events.length ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 text-[var(--foreground)]" : day ? "hover:bg-[var(--muted)] text-[var(--foreground)]" : ""} ${todayCell && !isSelected ? "ring-1 ring-[var(--accent)]" : ""}`}>
                  {day && (
                    <>
                      <span className={`font-display font-700 text-sm leading-none ${isSelected ? "text-black" : events.length ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>{day}</span>
                      {events.length > 0 && !isSelected && <div className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1" />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {selectedEvent ? (
            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl p-5 mb-2">
              <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Selected Screening</p>
              <h3 className="font-display font-800 text-xl text-[var(--foreground)] leading-tight mb-3">{selectedEvent.title}</h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {selectedEvent.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {selectedEvent.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg className="w-4 h-4 text-[var(--accent)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {selectedEvent.date}
                </div>
              </div>
              <button onClick={() => push("RSVP confirmed — see you there!")} className="btn-parallelogram w-full mt-4 py-2 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity">RSVP →</button>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">Click a highlighted date to see details</p>
          )}

          <h3 className="font-display font-700 text-lg text-[var(--foreground)]">Screenings — {MONTH_NAMES[view.m]}</h3>
          {inMonth.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No screenings this month.</p>}
          {inMonth.map((e) => {
            const { day, month } = fmtDate(e.date);
            const d = dayOf(e.date);
            return (
              <button key={e.id} onClick={() => setSelected(selected === d ? null : d)} className={`text-left bg-[var(--card)] border rounded-xl p-4 hover:border-[var(--accent)]/40 transition-all group ${selected === d ? "border-[var(--accent)]/50 bg-[var(--accent)]/5" : "border-[var(--border)]"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center flex-shrink-0">
                    <div className="font-display font-900 text-2xl text-[var(--accent)] leading-none">{day}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] font-medium">{month}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-tight truncate">{e.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{e.location}</p>
                    <p className="text-xs text-[var(--accent)] mt-0.5">{e.time}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Leaderboard Page ─────────────────────────────────────────────────────────
function LeaderboardPage({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  const [sortBy, setSortBy] = useState<"upvotes" | "reviews">("upvotes");
  const sorted = [...leaderboard].sort((a, b) => b[sortBy] - a[sortBy]);
  const podium = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <SectionHeader label="LEADERBOARD" pre="Club Rankings" />

      <div className="flex gap-1.5 mb-8 p-1 bg-[var(--muted)] rounded-full w-fit border border-[var(--border)]">
        {(["upvotes", "reviews"] as const).map((s) => (
          <button key={s} onClick={() => setSortBy(s)} className={`px-5 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all ${sortBy === s ? "bg-[var(--accent)] text-black shadow" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
            {s === "upvotes" ? "Most Upvotes" : "Most Reviews"}
          </button>
        ))}
      </div>

      {/* Podium */}
      {podium && (
        <div className="grid grid-cols-3 gap-2 mb-10 items-end">
          {podium.map((member, pi) => {
            const actualRank = pi === 0 ? 2 : pi === 1 ? 1 : 3;
            const podiumH = ["pb-6 pt-10", "pb-8 pt-16", "pb-4 pt-8"][pi];
            const medal = ["🥈", "🥇", "🥉"][pi];
            const ringColor = ["from-slate-400 to-slate-600", "from-amber-400 to-amber-600", "from-orange-400 to-orange-600"][pi];
            return (
              <div key={member.username} className="flex flex-col items-center">
                <div className="text-2xl mb-2">{medal}</div>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${ringColor} p-0.5 mb-2`}>
                  <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center">
                    <span className="font-display font-900 text-sm sm:text-base text-[var(--foreground)]">{initials(member.username)}</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] text-center leading-tight">{member.username}</p>
                <Badge label={badgeFor(member.reviews)} />
                <div className={`w-full ${podiumH} mt-3 rounded-t-2xl flex items-start justify-center pt-3 ${pi === 1 ? "bg-[var(--accent)]/15 border border-[var(--accent)]/25" : "bg-[var(--muted)] border border-[var(--border)]"}`}>
                  <span className={`font-display font-900 text-4xl sm:text-5xl ${pi === 1 ? "text-[var(--accent)]" : pi === 0 ? "text-slate-400" : "text-orange-400"}`}>#{actualRank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--muted)]/50">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">#</span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Member</span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:block text-right">Reviews</span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Upvotes</span>
        </div>
        {sorted.map((m, i) => (
          <div key={m.username} className={`grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 items-center px-5 py-3.5 transition-colors hover:bg-[var(--muted)]/50 ${i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
            <span className={`font-display font-900 text-lg ${i === 0 ? "text-[var(--accent)]" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-[var(--muted-foreground)]"}`}>{i + 1}</span>
            <div className="flex items-center gap-2.5 min-w-0">
              <Avt initials={initials(m.username)} size="xs" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{m.username}</p>
                <Badge label={badgeFor(m.reviews)} />
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--foreground)] hidden sm:block text-right">{m.reviews}</span>
            <span className="text-sm font-bold text-[var(--accent)] text-right">{m.upvotes.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
function ProfilePage({ movies, reviews, vault, members, following, onToggleFollow, session }: {
  movies: Movie[]; reviews: Review[]; vault: Record<VaultTab, string[]>; members: Profile[]; following: string[]; onToggleFollow: (id: string, username: string) => void; session: Session | null;
}) {
  const [tab, setTab] = useState<VaultTab>("watched");
  const [friendQ, setFriendQ] = useState("");

  const vaultMovies = vault[tab].map((id) => movies.find((m) => m.id === id)).filter((m): m is Movie => Boolean(m));
  const otherMembers = members.filter((m) => m.id !== session?.user.id);
  const filteredMembers = otherMembers.filter((f) => !friendQ || f.username.toLowerCase().includes(friendQ.toLowerCase()));
  const username = session?.user.username ?? "CinemaVault";
  const netUpvotes = reviews.reduce((a, r) => a + r.upvotes - r.downvotes, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
      {/* Banner */}
      <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-[var(--muted)]">
        <img src="https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1400&h=300&fit=crop&auto=format" alt="Profile banner" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/70 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8 -mt-8 px-2">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] flex items-center justify-center border-4 border-[var(--background)] shadow-xl flex-shrink-0">
          <span className="font-display font-900 text-2xl text-[var(--accent-foreground)]">{initials(username)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="font-display font-900 text-3xl sm:text-4xl text-[var(--foreground)]">{username}</h1>
            <Badge label={badgeFor(reviews.length)} />
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Member since Jan 2023 · Brooklyn, NY</p>
        </div>
        <button className="btn-parallelogram px-5 py-2 bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-sm font-semibold hover:border-[var(--accent)] transition-colors flex-shrink-0">
          Edit Profile
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { label: "Reviews", val: String(reviews.length) },
          { label: "Upvotes", val: netUpvotes.toLocaleString() },
          { label: "Following", val: String(following.length) },
          { label: "Vault", val: String(vault.watched.length + vault.plantowatch.length + vault.favorites.length) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 text-center hover:border-[var(--accent)]/30 transition-colors">
            <p className="font-display font-900 text-2xl sm:text-3xl text-[var(--foreground)]">{val}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cinema Vault */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            <h2 className="font-display font-900 text-2xl text-[var(--foreground)]">CINEMA VAULT</h2>
          </div>

          <div className="flex gap-1 mb-5 p-1 bg-[var(--muted)] rounded-full w-fit border border-[var(--border)]">
            {(["watched", "plantowatch", "favorites"] as VaultTab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${tab === t ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm border border-[var(--border)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"}`}>
                {t === "watched" ? "Watched" : t === "plantowatch" ? "Plan to Watch" : "★ Favorites"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {vaultMovies.map((m) => (
              <div key={m.id} className="group cursor-pointer">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] relative">
                  <img src={m.poster} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                  {tab === "favorites" && <div className="absolute top-1.5 right-1.5 text-[var(--star)] text-sm drop-shadow">★</div>}
                </div>
                <p className="text-xs font-semibold text-[var(--foreground)] mt-1.5 truncate">{m.title}</p>
                <p className="text-[10px] font-bold text-[var(--star)]">★ {m.rating}</p>
              </div>
            ))}
            {vaultMovies.length === 0 && <p className="text-sm text-[var(--muted-foreground)] col-span-full py-8 text-center">Nothing here yet.</p>}
          </div>

          {/* Recent Reviews */}
          <h2 className="font-display font-900 text-2xl text-[var(--foreground)] mb-4">RECENT REVIEWS</h2>
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 3).map((r) => {
              const m = movies.find((mv) => mv.id === r.movie_id);
              if (!m) return null;
              return (
                <div key={r.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex gap-3 hover:border-[var(--accent)]/30 transition-colors">
                  <img src={m.poster} alt={m.title} className="w-12 h-[68px] object-cover rounded-lg flex-shrink-0 bg-[var(--muted)]" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-display font-700 text-sm text-[var(--foreground)] truncate">{m.title}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">{m.year}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StarRating rating={r.rating} />
                        <span className="text-xs font-bold text-[var(--accent)]">{r.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--secondary-foreground)] line-clamp-2 leading-relaxed">{r.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                      <span>{timeAgo(r.created_at)}</span>
                      <span>↑ {r.upvotes}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Find Friends */}
          <div>
            <h2 className="font-display font-900 text-xl text-[var(--foreground)] mb-3">FIND FRIENDS</h2>
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input value={friendQ} onChange={(e) => setFriendQ(e.target.value)} placeholder="Search members…" className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              {filteredMembers.slice(0, 6).map((f) => (
                <div key={f.id} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-2.5 hover:border-[var(--accent)]/30 transition-colors">
                  <Avt initials={initials(f.username)} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">{f.username}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">{f.role}</p>
                  </div>
                  <button onClick={() => onToggleFollow(f.id, f.username)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${following.includes(f.id) ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30" : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"}`}>
                    {following.includes(f.id) ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <h3 className="font-display font-700 text-base text-[var(--foreground)] mb-3">ACTIVITY STATS</h3>
            {[
              { label: "Avg Rating Given", val: "8.4 / 10" },
              { label: "Favourite Genre", val: "Drama" },
              { label: "Most Active Month", val: "March" },
              { label: "Reviews This Year", val: "34" },
              { label: "Films in Vault", val: String(vault.watched.length + vault.plantowatch.length + vault.favorites.length) },
              { label: "Polls Voted", val: "18" },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
                <span className="text-sm font-bold text-[var(--foreground)]">{val}</span>
              </div>
            ))}
          </div>

          {/* Genre chart */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <h3 className="font-display font-700 text-base text-[var(--foreground)] mb-4">GENRE BREAKDOWN</h3>
            {[{ g: "Drama", pct: 42, n: 62 }, { g: "Thriller", pct: 22, n: 32 }, { g: "Sci-Fi", pct: 16, n: 24 }, { g: "Romance", pct: 12, n: 17 }, { g: "Horror", pct: 8, n: 12 }].map(({ g, pct, n }) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--foreground)]">{g}</span>
                  <span className="text-xs text-[var(--muted-foreground)]">{n} films</span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent)] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminPage({ screenings, onAddScreening, onDeleteScreening, polls, onAddPoll, onTogglePoll, onDeletePoll, reviews, movies, onDeleteReview }: {
  screenings: Screening[]; onAddScreening: (s: Omit<Screening, "id">) => void; onDeleteScreening: (id: string) => void;
  polls: Poll[]; onAddPoll: (question: string, closes: string, options: string[]) => void; onTogglePoll: (id: string) => void; onDeletePoll: (id: string) => void;
  reviews: Review[]; movies: Movie[]; onDeleteReview: (id: string) => void;
}) {
  // Screening form
  const [sTitle, setSTitle] = useState("");
  const [sDate, setSDate] = useState("");
  const [sTime, setSTime] = useState("");
  const [sLoc, setSLoc] = useState("");

  // Poll form
  const [pQuestion, setPQuestion] = useState("");
  const [pCloses, setPCloses] = useState("");
  const [pOptions, setPOptions] = useState(["", ""]);

  const inputCls = "w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors";

  const addScreening = () => {
    if (!sTitle.trim() || !sDate || !sTime.trim()) return;
    onAddScreening({ title: sTitle.trim(), date: sDate, time: sTime.trim(), location: sLoc.trim() || "Streaming" });
    setSTitle(""); setSDate(""); setSTime(""); setSLoc("");
  };

  const addPoll = () => {
    const opts = pOptions.map((o) => o.trim()).filter(Boolean);
    if (!pQuestion.trim() || opts.length < 2) return;
    onAddPoll(pQuestion.trim(), pCloses || "TBD", opts);
    setPQuestion(""); setPCloses(""); setPOptions(["", ""]);
  };

  const setOpt = (i: number, v: string) => setPOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addOpt = () => setPOptions((prev) => [...prev, ""]);
  const removeOpt = (i: number) => setPOptions((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <SectionHeader label="ADMIN CONSOLE" pre="Club Management" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screenings */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">SCREENINGS</h3>
          <div className="flex flex-col gap-2 mb-4">
            <input value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="Movie title" className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} className={inputCls} />
              <input value={sTime} onChange={(e) => setSTime(e.target.value)} placeholder="Time (8:00 PM)" className={inputCls} />
            </div>
            <input value={sLoc} onChange={(e) => setSLoc(e.target.value)} placeholder="Location" className={inputCls} />
            <button onClick={addScreening} disabled={!sTitle.trim() || !sDate || !sTime.trim()} className="btn-parallelogram py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">ADD SCREENING</button>
          </div>
          <div className="flex flex-col gap-2">
            {[...screenings].sort((a, b) => a.date.localeCompare(b.date)).map((s) => (
              <div key={s.id} className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{s.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{s.date} · {s.time} · {s.location}</p>
                </div>
                <button onClick={() => onDeleteScreening(s.id)} className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">Delete</button>
              </div>
            ))}
            {screenings.length === 0 && <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No screenings.</p>}
          </div>
        </div>

        {/* Polls */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">POLLS</h3>
          <div className="flex flex-col gap-2 mb-4">
            <input value={pQuestion} onChange={(e) => setPQuestion(e.target.value)} placeholder="Poll question" className={inputCls} />
            <input type="date" value={pCloses} onChange={(e) => setPCloses(e.target.value)} className={inputCls} />
            {pOptions.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} className={inputCls} />
                {pOptions.length > 2 && <button onClick={() => removeOpt(i)} className="px-2 text-[var(--muted-foreground)] hover:text-[var(--accent)] text-sm">✕</button>}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={addOpt} className="px-3 py-1.5 text-xs font-semibold border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors">+ Add option</button>
              <button onClick={addPoll} disabled={!pQuestion.trim() || pOptions.map((o) => o.trim()).filter(Boolean).length < 2} className="btn-parallelogram flex-1 py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40">CREATE POLL</button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {polls.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{p.question}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{p.options.length} options · {p.status === "open" ? `Closes ${fmtCloses(p.closes)}` : "Closed"}</p>
                </div>
                <button onClick={() => onTogglePoll(p.id)} className={`text-xs font-semibold transition-colors ${p.status === "open" ? "text-[var(--muted-foreground)] hover:text-[var(--foreground)]" : "text-[var(--accent)]"}`}>{p.status === "open" ? "Close" : "Reopen"}</button>
                <button onClick={() => onDeletePoll(p.id)} className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">Delete</button>
              </div>
            ))}
            {polls.length === 0 && <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No polls.</p>}
          </div>
        </div>
      </div>

      {/* Reviews moderation */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">REVIEWS</h3>
        <div className="flex flex-col gap-2">
          {reviews.map((r) => {
            const m = movies.find((mv) => mv.id === r.movie_id);
            return (
              <div key={r.id} className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">{m ? m.title : "Unknown"} <span className="text-[var(--muted-foreground)] font-normal">· {r.username} · {r.rating}/10</span></p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">{r.body}</p>
                </div>
                <button onClick={() => onDeleteReview(r.id)} className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors">Delete</button>
              </div>
            );
          })}
          {reviews.length === 0 && <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No reviews.</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ setPage, isAdmin }: { setPage: (p: Page) => void; isAdmin: boolean }) {
  const pages: Page[] = ["home", "calendar", "leaderboard", "profile", ...(isAdmin ? ["admin" as Page] : [])];
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[var(--accent-foreground)]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>
            </div>
            <span className="font-display font-800 text-sm tracking-widest text-[var(--foreground)]">ABSOLUTE CINEMA</span>
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {pages.map((p) => (
              <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0 }); }} className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors capitalize">{p}</button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">© 2026 Absolute Cinema · All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [dark, setDark] = usePersistentState("ac-dark", () => true);
  const [showSignIn, setShowSignIn] = useState(false);
  const { toasts, push } = useToast();

  useInitAuth();
  const session = useSession();
  const auth = useAuth();
  const isAdmin = session?.user.role === "admin";

  const movies = useMovies();
  const reviews = useReviews();
  const threads = useThreads();
  const polls = usePolls();
  const screenings = useScreenings();
  const leaderboard = useLeaderboard();
  const members = useMembers();
  const vault = useVault();
  const following = useFollowing();
  const userVotes = useMyReviewVotes();
  const pollVotes = useMyPollVotes();

  const createReview = useCreateReview();
  const voteReview = useVoteReview();
  const addReply = useAddReply();
  const castPollVote = useCastPollVote();
  const toggleFavorite = useToggleFavorite();
  const toggleFollow = useToggleFollow();
  const addScreening = useAddScreening();
  const deleteScreening = useDeleteScreening();
  const addPoll = useAddPoll();
  const togglePoll = useTogglePoll();
  const deletePoll = useDeletePoll();
  const deleteReview = useDeleteReview();

  const setPageSafe = useCallback((p: Page) => setPage(p), []);

  const moviesData = movies.data ?? [];
  const reviewsData = reviews.data ?? [];
  const threadsData = threads.data ?? {};
  const pollsData = polls.data ?? [];
  const screeningsData = screenings.data ?? [];
  const leaderboardData = leaderboard.data ?? [];
  const membersData = members.data ?? [];
  const vaultData = vault.data ?? { watched: [], plantowatch: [], favorites: [] };
  const followingData = following.data ?? [];
  const userVotesData = userVotes.data ?? {};
  const pollVotesData = pollVotes.data ?? {};

  const onVote = (id: string, dir: "up" | "down") => {
    voteReview.mutate({ id, dir });
    push(dir === "up" ? "Upvoted review" : "Downvoted review");
  };

  const onReply = (reviewId: string, body: string) => {
    addReply.mutate({ reviewId, body }, { onSuccess: () => push("Reply posted!") });
  };

  const onWriteReview = (movieId: string, rating: number, body: string) => {
    createReview.mutate({ movie_id: movieId, rating, body }, {
      onSuccess: () => push("Review published!"),
      onError: () => push("Couldn't publish review", "info"),
    });
  };

  const onPollVote = (pollId: string, idx: number) => {
    castPollVote.mutate({ pollId, optionIndex: idx }, { onSuccess: () => push("Vote cast!") });
  };

  const onToggleFavorite = (movieId: string) => {
    toggleFavorite.mutate(movieId, { onSuccess: () => push("Updated Cinema Vault") });
  };

  const onToggleFollow = (memberId: string, username: string) => {
    toggleFollow.mutate(memberId, { onSuccess: () => push(`Updated ${username}`) });
  };

  const onAddScreening = (s: Omit<Screening, "id">) => {
    addScreening.mutate(s, { onSuccess: () => push("Screening added") });
  };

  const onDeleteScreening = (id: string) => {
    deleteScreening.mutate(id, { onSuccess: () => push("Screening removed") });
  };

  const onAddPoll = (question: string, closes: string, options: string[]) => {
    addPoll.mutate({ question, closes, options }, { onSuccess: () => push("Poll created") });
  };

  const onTogglePoll = (id: string) => {
    togglePoll.mutate(id);
  };

  const onDeletePoll = (id: string) => {
    deletePoll.mutate(id, { onSuccess: () => push("Poll deleted") });
  };

  const onDeleteReview = (id: string) => {
    deleteReview.mutate(id, { onSuccess: () => push("Review removed") });
  };

  return (
    <div className={`${dark ? "" : "light"} min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`} style={{ fontFamily: "'Outfit', sans-serif" }}>
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      <Toast toasts={toasts} />

      <NavBar page={page} setPage={setPageSafe} dark={dark} setDark={setDark} session={session} isAdmin={isAdmin} onSignIn={() => setShowSignIn(true)} onSignOut={() => auth.signOut()} />

      <main>
        {page === "home" && <HomePage movies={moviesData} reviews={reviewsData} threads={threadsData} userVotes={userVotesData} onVote={onVote} onReply={onReply} polls={pollsData} pollVotes={pollVotesData} onPollVote={onPollVote} favorites={vaultData.favorites} onToggleFavorite={onToggleFavorite} onWriteReview={onWriteReview} />}
        {page === "calendar" && <CalendarPage screenings={screeningsData} push={push} />}
        {page === "leaderboard" && <LeaderboardPage leaderboard={leaderboardData} />}
        {page === "profile" && <ProfilePage movies={moviesData} reviews={reviewsData} vault={vaultData} members={membersData} following={followingData} onToggleFollow={onToggleFollow} session={session} />}
        {page === "admin" && (isAdmin ? <AdminPage screenings={screeningsData} onAddScreening={onAddScreening} onDeleteScreening={onDeleteScreening} polls={pollsData} onAddPoll={onAddPoll} onTogglePoll={onTogglePoll} onDeletePoll={onDeletePoll} reviews={reviewsData} movies={moviesData} onDeleteReview={onDeleteReview} /> : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
            <p className="font-display font-900 text-4xl text-[var(--muted-foreground)]">ADMIN ONLY</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-2">You need the admin role to see this page.</p>
          </div>
        ))}
      </main>

      <Footer setPage={setPageSafe} isAdmin={isAdmin} />
    </div>
  );
}
