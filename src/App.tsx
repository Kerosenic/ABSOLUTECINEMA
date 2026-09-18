import { useState, useCallback, useEffect, useRef } from "react"

import type {
  Movie,
  Review,
  Reply,
  Poll,
  Screening,
  VaultTab,
  LeaderboardRow,
  Profile,
  Session,
  Announcement,
} from "./lib/types"

import {
  initials,
  timeAgo,
  badgeFor,
  fmtCloses,
  fmtDate,
  MONTH_NAMES,
} from "./lib/format"

import {
  reviewSchema,
  pollSchema,
  screeningSchema,
  movieSchema,
  announcementSchema,
  signInSchema,
  signUpSchema,
  parseForm,
  type FieldErrors,
} from "./lib/validation"

import { GENRES, YEARS, RATINGS, TRENDING_IDS } from "./lib/mock"

import {
  useInitAuth,
  useSession,
  useAuth,
  useMovies,
  useReviews,
  useThreads,
  usePolls,
  useScreenings,
  useLeaderboard,
  useMembers,
  useVault,
  useFollowing,
  useMyReviewVotes,
  useMyPollVotes,
  useCreateReview,
  useVoteReview,
  useAddReply,
  useCastPollVote,
  useToggleFavorite,
  useToggleFollow,
  useAddScreening,
  useDeleteScreening,
  useAddPoll,
  useTogglePoll,
  useDeletePoll,
  useDeleteReview,
  useNotifications,
  useMarkNotificationsRead,
  useAddMovie,
  useDeleteMovie,
  useRestoreMovie,
  useDeletedMovies,
  useDeleteComment,
  useAnnouncements,
  useAddAnnouncement,
  useDeleteAnnouncement,
  useSetMemberRole,
  useSetReviewFeatured,
  useUpdateUsername,
} from "./lib/queries"

import { useRealtime } from "./lib/realtime"

import { setSession } from "./lib/session"

import { uploadAvatar, updateAvatar, uploadPoster } from "./lib/api"

import logoUrl from "../logo.png"

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "home" | "calendar" | "leaderboard" | "profile" | "admin"

// Club code that unlocks the admin console. Client-side gate; see AdminGate.

const ADMIN_CODE = "AMENICETULOSBA"

// ─── Persistent state ─────────────────────────────────────────────────────────

function usePersistentState<T>(key: string, makeInitial: () => T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)

      if (raw != null) return JSON.parse(raw) as T
    } catch {
      /* ignore */
    }

    return makeInitial()
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [key, state])

  return [state, setState] as const
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastMsg = { id: number text: string type: "success" | "info" }

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-2.5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xl text-sm font-medium text-[var(--foreground)] flex items-center gap-2 animate-fade-in"
        >
          {t.type === "success" && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
          )}
          {t.text}
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const counter = useRef(0)

  const push = useCallback(
    (text: string, type: ToastMsg["type"] = "success") => {
      const id = ++counter.current

      setToasts((t) => [...t, { id, text, type }])

      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
    },
    [],
  )

  return { toasts, push }
}

// ─── Dialog a11y ──────────────────────────────────────────────────────────────

// Traps Tab inside a dialog, focuses the first control on open, and restores

// focus to the previously-focused element on close.

function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const node = ref.current

    if (!node) return

    const previous = document.activeElement as HTMLElement | null

    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      )

        .filter(
          (el) =>
            !el.hasAttribute("disabled") &&
            el.getAttribute("aria-hidden") !== "true",
        )

    focusable()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      const els = focusable()

      if (els.length === 0) return

      const firstEl = els[0]

      const lastEl = els[els.length - 1]

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()

        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()

        firstEl.focus()
      }
    }

    node.addEventListener("keydown", onKey)

    return () => {
      node.removeEventListener("keydown", onKey)

      previous?.focus?.()
    }
  }, [active])

  return ref
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function StarRating({ rating, max = 10 }: { rating: number max?: number }) {
  const filled = Math.round((rating / max) * 5)

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 transition-colors ${
            i < filled ? "text-[var(--star)]" : "text-[var(--border)]"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function InteractiveStars({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${i + 1} of 10`}
          aria-pressed={i < value}
          className={`text-lg transition-all ${
            i < (hover || value)
              ? "text-[var(--star)] scale-110"
              : "text-[var(--border)]"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function Avt({
  initials: text,
  size = "md",
  color,
  src,
}: {
  initials: string
  size?: "xs" | "sm" | "md" | "lg"
  color?: string
  src?: string | null
}) {
  const s = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
  }[size]

  const bg = color || "from-[var(--accent)] to-[var(--primary)]"

  return (
    <div
      className={`${s} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center font-display font-bold text-[var(--accent-foreground)] flex-shrink-0 overflow-hidden`}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        text
      )}
    </div>
  )
}

function Badge({ label }: { label: string }) {
  const map: Record<string, string> = {
    Auteur: "bg-amber-500/15 text-amber-400 border-amber-500/25",

    Cinematheque: "bg-purple-500/15 text-purple-400 border-purple-500/25",

    Projectionist: "bg-blue-500/15 text-blue-400 border-blue-500/25",

    Critic: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",

    Reviewer:
      "bg-[var(--border)]/40 text-[var(--muted-foreground)] border-[var(--border)]",
  }

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${map[label] || map.Reviewer}`}
    >
      {label}
    </span>
  )
}

function SectionHeader({
  label,
  pre,
  action,
  onAction,
}: {
  label: string
  pre?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-end gap-4 mb-7">
      <div>
        {pre && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">
            {pre}
          </p>
        )}
        <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">
          {label}
        </h2>
      </div>
      <span className="flex-1 h-px bg-[var(--border)] mb-2" />
      {action && (
        <button
          onClick={onAction}
          className="text-sm text-[var(--accent)] font-semibold hover:opacity-70 transition-opacity whitespace-nowrap mb-1"
        >
          {action} →
        </button>
      )}
    </div>
  )
}

// ─── Sign In Modal ────────────────────────────────────────────────────────────

function SignInModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin")

  const [email, setEmail] = useState("")

  const [pass, setPass] = useState("")

  const [username, setUsername] = useState("")

  const [code, setCode] = useState("")

  const [sent, setSent] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [notice, setNotice] = useState<string | null>(null)

  const [busy, setBusy] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const [resendCooldown, setResendCooldown] = useState(0)

  const auth = useAuth()

  const ref = useFocusTrap(true)

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()

    window.addEventListener("keydown", esc)

    return () => window.removeEventListener("keydown", esc)
  }, [onClose])

  useEffect(() => {
    if (resendCooldown <= 0) return

    const t = setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000,
    )

    return () => clearInterval(t)
  }, [resendCooldown])

  const msg = (e: unknown) =>
    e instanceof Error ? e.message : "Something went wrong"

  const resend = async () => {
    if (resendCooldown > 0 || busy) return

    setBusy(true)

    setError(null)

    try {
      await auth.sendSignupCode(email)

      setResendCooldown(10)

      setNotice(`Code resent to ${email}. Check spam if you don't see it.`)
    } catch (e) {
      setError(msg(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    // Sign-up, step 2: verify the code, then create the account and sign in.

    if (mode === "signup" && sent) {
      if (!/^\d{6}$/.test(code)) {
        setError("Enter the 6-digit code")

        return
      }

      setBusy(true)

      setError(null)

      setNotice(null)

      try {
        await auth.verifySignup(email, pass, username, code)

        await auth.signIn(email, pass)

        onClose()
      } catch (e) {
        setError(msg(e))
      } finally {
        setBusy(false)
      }

      return
    }

    const { errors } = parseForm(
      mode === "signin" ? signInSchema : signUpSchema,
      { email, password: pass, username },
    )

    setFieldErrors(errors)

    if (Object.keys(errors).length) return

    setBusy(true)

    setError(null)

    setNotice(null)

    try {
      if (mode === "signin") {
        await auth.signIn(email, pass)

        onClose()
      } else {
        await auth.sendSignupCode(email)

        setSent(true)

        setResendCooldown(10)

        setNotice(`Code sent to ${email}. Check spam if you don't see it.`)
      }
    } catch (e) {
      setError(msg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "signin" ? "Sign in" : "Create account"}
        className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-6">
          <img src={logoUrl} alt="Absolute Cinema" className="h-8 w-auto" />
        </div>

        <h2 className="font-display font-900 text-3xl text-[var(--foreground)] mb-1">
          {mode === "signin" ? "WELCOME BACK" : "JOIN THE CLUB"}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          {mode === "signin"
            ? "Sign in to your account"
            : "Create your free account"}
        </p>

        <div className="flex flex-col gap-3 mb-5">
          {mode === "signup" && (
            <div>
              <input
                value={username}
                disabled={sent}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setFieldErrors((f) => ({ ...f, username: "" }))
                }}
                placeholder="Username"
                aria-invalid={!!fieldErrors.username}
                className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
              />
              {fieldErrors.username && (
                <p className="text-xs text-[var(--accent)] mt-1">
                  {fieldErrors.username}
                </p>
              )}
            </div>
          )}
          <div>
            <input
              type="email"
              value={email}
              disabled={sent}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors((f) => ({ ...f, email: "" }))
              }}
              placeholder="Email address"
              aria-invalid={!!fieldErrors.email}
              className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            {fieldErrors.email && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {fieldErrors.email}
              </p>
            )}
            {mode === "signup" && !fieldErrors.email && !sent && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Use a @tsinglan.org email
              </p>
            )}
          </div>
          <div>
            <input
              type="password"
              value={pass}
              disabled={sent}
              onChange={(e) => {
                setPass(e.target.value)
                setFieldErrors((f) => ({ ...f, password: "" }))
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Password"
              aria-invalid={!!fieldErrors.password}
              className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
            />
            {fieldErrors.password && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>
          {mode === "signup" && sent && (
            <div>
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""))
                  setError(null)
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                aria-invalid={!!error}
                className="w-full px-4 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors tracking-[0.3em] text-center"
              />
              <button
                onClick={resend}
                disabled={resendCooldown > 0 || busy}
                className="mt-2 w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-xs text-[var(--foreground)] font-semibold hover:bg-[var(--border)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          )}
        </div>

        {notice && (
          <p className="text-xs text-[var(--muted-foreground)] mb-4">
            {notice}
          </p>
        )}
        {error && <p className="text-xs text-[var(--accent)] mb-4">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || !email || !pass}
          className="btn-parallelogram w-full py-3 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity text-sm tracking-wide disabled:opacity-40"
        >
          {busy
            ? "PLEASE WAIT…"
            : mode === "signin"
              ? "SIGN IN"
              : sent
                ? "VERIFY & CREATE"
                : "SEND CODE"}
        </button>

        <p className="text-xs text-center text-[var(--muted-foreground)] mt-4">
          {mode === "signin" ? "New here?" : "Already a member?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin")
              setError(null)
              setNotice(null)
              setFieldErrors({})
              setSent(false)
              setCode("")
            }}
            className="text-[var(--accent)] font-semibold hover:opacity-80"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Notification bell ────────────────────────────────────────────────────────

function NotificationBell({
  onNavigate,
}: {
  onNavigate: (link?: string | null) => void
}) {
  const { data: notifications = [] } = useNotifications()

  const markRead = useMarkNotificationsRead()

  const [open, setOpen] = useState(false)

  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return

    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }

    document.addEventListener("mousedown", onDoc)

    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  const toggle = () => {
    const next = !open

    setOpen(next)

    if (next && unread > 0) markRead.mutate()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        className="relative p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-[60] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl overflow-hidden lg:absolute lg:inset-x-auto lg:top-full lg:right-0 lg:mt-2 lg:w-80">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={() => markRead.mutate()}
                className="text-xs font-medium text-[var(--accent)] hover:opacity-80"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-sm text-[var(--muted-foreground)] text-center">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false)
                    onNavigate(n.link)
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/40 transition-colors ${
                    n.read ? "" : "bg-[var(--accent)]/5"
                  }`}
                >
                  <span className="block text-sm text-[var(--foreground)]">
                    {n.body}
                  </span>
                  <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                    {timeAgo(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function NavBar({
  page,
  setPage,
  dark,
  setDark,
  session,
  onSignIn,
  onSignOut,
}: {
  page: Page
  setPage: (p: Page) => void
  dark: boolean
  setDark: (v: boolean) => void

  session: Session | null
  onSignIn: () => void
  onSignOut: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)

    window.addEventListener("scroll", onScroll)

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const navTo = (id: string) => {
    if (["reviews", "polls", "library"].includes(id)) {
      setPage("home")

      setTimeout(
        () =>
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      )
    } else {
      setPage(id as Page)

      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    setMenuOpen(false)
  }

  const onNotifNav = (link?: string | null) => {
    setMenuOpen(false)

    if (link) {
      setPage("home")

      setTimeout(
        () =>
          document
            .getElementById("reviews")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      )
    } else {
      setPage("profile")

      window.scrollTo({ top: 0 })
    }
  }

  const navLinks = [
    { label: "Home", id: "home" },

    { label: "Reviews", id: "reviews" },

    { label: "Polls", id: "polls" },

    { label: "Movies", id: "library" },

    { label: "Calendar", id: "calendar" },

    { label: "Leaderboard", id: "leaderboard" },

    { label: "Admin", id: "admin" },
  ]

  const isActive = (id: string) => {
    if (id === "home" && page === "home") return true

    if (id === page) return true

    return false
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--background)]/95 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-[var(--border)]"
          : "bg-gradient-to-b from-[var(--background)]/80 to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
        {/* Logo */}
        <button
          onClick={() => navTo("home")}
          className="flex items-center gap-2 group flex-shrink-0"
        >
          <img
            src={logoUrl}
            alt="Absolute Cinema"
            className="h-7 w-auto group-hover:opacity-80 transition-opacity"
          />
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => navTo(l.id)}
              className={`relative text-sm font-medium transition-colors py-1 ${
                isActive(l.id)
                  ? "text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {l.label}
              {isActive(l.id) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[var(--accent)] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setDark(!dark)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            className="relative w-11 h-6 rounded-full border border-[var(--border)] bg-[var(--muted)] transition-colors hover:border-[var(--accent)]/50"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                dark
                  ? "left-0.5 bg-[var(--muted-foreground)]"
                  : "left-5 bg-[var(--accent)]"
              }`}
            >
              {dark ? (
                <svg
                  className="w-3 h-3 text-[var(--background)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </button>
          {session && <NotificationBell onNavigate={onNotifNav} />}
          {session ? (
            <>
              <button
                onClick={() => navTo("profile")}
                className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Avt
                  initials={initials(session.user.username)}
                  size="xs"
                  src={session.user.avatar_url}
                />
                <span className="font-medium">{session.user.username}</span>
              </button>
              <button
                onClick={onSignOut}
                className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="btn-parallelogram px-4 py-1.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity tracking-wide"
            >
              SIGN IN
            </button>
          )}
        </div>

        {/* Mobile right */}
        <div className="lg:hidden flex items-center gap-2">
          {session && <NotificationBell onNavigate={onNotifNav} />}
          <button
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={dark}
            className="relative w-10 h-5 rounded-full border border-[var(--border)] bg-[var(--muted)]"
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--accent)] transition-all duration-300 ${
                dark ? "left-0.5" : "left-5"
              }`}
            />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="p-1.5 text-[var(--foreground)]"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--border)] bg-[var(--background)]/98 backdrop-blur-lg px-4 py-5 flex flex-col gap-1">
          {navLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => navTo(l.id)}
              className={`text-sm font-medium py-2 text-left transition-colors ${
                isActive(l.id)
                  ? "text-[var(--accent)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {l.label}
            </button>
          ))}
          <div className="border-t border-[var(--border)] pt-3 mt-2">
            {session ? (
              <button
                onClick={() => {
                  onSignOut()
                  setMenuOpen(false)
                }}
                className="btn-parallelogram w-full py-2.5 bg-[var(--muted)] text-[var(--foreground)] text-sm font-bold"
              >
                SIGN OUT
              </button>
            ) : (
              <button
                onClick={() => {
                  onSignIn()
                  setMenuOpen(false)
                }}
                className="btn-parallelogram w-full py-2.5 bg-[var(--accent)] text-black text-sm font-bold"
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero Banner ──────────────────────────────────────────────────────────────

function HeroBanner({
  movies,
  reviews,
}: {
  movies: Movie[]
  reviews: Review[]
}) {
  const [activeIdx, setActiveIdx] = useState(0)

  const slides = reviews.filter((r) => r.featured)

  const featured = slides.length > 0 ? slides : reviews.slice(0, 3)

  useEffect(() => {
    if (featured.length <= 1) return

    const t = setInterval(
      () => setActiveIdx((i) => (i + 1) % featured.length),
      6000,
    )

    return () => clearInterval(t)
  }, [featured.length])

  if (featured.length === 0) return null

  const review = featured[Math.min(activeIdx, featured.length - 1)]

  const movie = movies.find((m) => m.id === review.movie_id)

  if (!movie) return null

  const fallbackPosters = [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop&auto=format",

    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1600&h=900&fit=crop&auto=format",

    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&h=900&fit=crop&auto=format",
  ]

  return (
    <div className="relative h-[88vh] min-h-[560px] overflow-hidden">
      {featured.map((r, i) => {
        const m = movies.find((mv) => mv.id === r.movie_id)

        const src =
          r.background_url ||
          m?.poster ||
          fallbackPosters[i % fallbackPosters.length]

        return (
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              i === activeIdx ? "opacity-100" : "opacity-0"
            }`}
          />
        )
      })}

      {/* Layered gradients for cinematic look */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--background)]/30" />
      <div className="absolute inset-0 bg-[var(--background)]/20" />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px",
        }}
      />

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-20">
        <div className="max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
              Featured Review
            </span>
            <span className="w-6 h-px bg-[var(--accent)]" />
            <span className="text-xs text-[var(--muted-foreground)]">
              {movie.year} · {movie.genre}
            </span>
          </div>
          <h1 className="font-display font-900 text-[clamp(3rem,10vw,6rem)] leading-[0.9] tracking-tight text-[var(--foreground)] mb-4 uppercase">
            {movie.title}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={review.rating} />
            <span className="font-display font-900 text-3xl text-[var(--accent)] leading-none">
              {review.rating}
              <span className="text-sm font-400 text-[var(--muted-foreground)]">
                /10
              </span>
            </span>
            <span className="text-sm text-[var(--muted-foreground)]">
              by{" "}
              <span className="text-[var(--foreground)] font-medium">
                {review.username}
              </span>
            </span>
          </div>
          <p className="text-[var(--secondary-foreground)] text-sm sm:text-base leading-relaxed mb-7 max-w-md line-clamp-3">
            {review.body}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() =>
                document
                  .getElementById("reviews")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-parallelogram px-6 py-2.5 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-all hover:scale-[1.02] text-sm tracking-wide"
            >
              READ REVIEW
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("reviews")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="btn-parallelogram px-6 py-2.5 border border-[var(--foreground)]/20 text-[var(--foreground)] font-semibold hover:border-[var(--foreground)]/50 transition-colors text-sm backdrop-blur-sm"
            >
              ALL REVIEWS
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-8">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-0.5 transition-all rounded-full ${
                i === activeIdx
                  ? "w-8 bg-[var(--accent)]"
                  : "w-3 bg-[var(--foreground)]/30 hover:bg-[var(--foreground)]/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Horizontal Movie Row ─────────────────────────────────────────────────────

function MovieRow({
  title,
  pre,
  movieIds,
  movies,
  favorites,
  onToggleFavorite,
}: {
  title: string
  pre: string
  movieIds: string[]
  movies: Movie[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  const rowMovies = movieIds
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => Boolean(m))

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: dir === "right" ? 280 : -280,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative group/row">
      <SectionHeader label={title} pre={pre} />
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-[var(--background)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-start pl-1"
        >
          <svg
            className="w-5 h-5 text-[var(--foreground)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-2"
        >
          {rowMovies.map((movie) => (
            <RowCard
              key={movie.id}
              movie={movie}
              saved={favorites.includes(movie.id)}
              onToggle={() => onToggleFavorite(movie.id)}
            />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-[var(--background)] to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-end pr-1"
        >
          <svg
            className="w-5 h-5 text-[var(--foreground)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

function RowCard({
  movie,
  saved,
  onToggle,
}: {
  movie: Movie
  saved: boolean
  onToggle: () => void
}) {
  return (
    <div className="group flex-shrink-0 w-32 sm:w-36 cursor-pointer">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] mb-2">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.opacity = "0"
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-[var(--star)]">
                ★ {movie.rating}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              aria-label={saved ? "Remove from favorites" : "Add to favorites"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                saved
                  ? "bg-[var(--accent)] text-black"
                  : "bg-black/50 text-white hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-white font-medium">
            {movie.genre}
          </span>
        </div>
      </div>
      <p className="text-xs font-semibold text-[var(--foreground)] truncate leading-tight">
        {movie.title}
      </p>
      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
        {movie.year}
      </p>
    </div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  replies,
  userVote,
  onVote,
  onReply,
  movies,
}: {
  review: Review
  replies: Reply[]
  userVote: "up" | "down" | null
  onVote: (id: string, dir: "up" | "down") => void
  onReply: (id: string, body: string) => void
  movies: Movie[]
}) {
  const movie = movies.find((m) => m.id === review.movie_id)

  const [showReplies, setShowReplies] = useState(false)

  const [replyText, setReplyText] = useState("")

  const up = review.upvotes + (userVote === "up" ? 1 : 0)

  const down = review.downvotes + (userVote === "down" ? 1 : 0)

  if (!movie) return null

  const submitReply = () => {
    if (!replyText.trim()) return

    onReply(review.id, replyText.trim())

    setReplyText("")
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent)]/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 flex flex-col">
      <div className="flex gap-4 p-4 pb-3">
        <div className="relative flex-shrink-0">
          <img
            src={movie.poster}
            alt={movie.title}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.opacity = "0"
            }}
            className="w-[72px] h-[100px] object-cover rounded-xl bg-[var(--muted)]"
          />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent)] border-2 border-[var(--card)] flex items-center justify-center shadow">
            <span className="text-xs font-display font-900 text-[var(--accent-foreground)] leading-none">
              {review.rating}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-display font-800 text-base text-[var(--foreground)] leading-tight truncate">
                {movie.title}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {movie.year} · {movie.director}
              </p>
            </div>
            <div className="flex-shrink-0">
              <StarRating rating={review.rating} />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Avt initials={initials(review.username)} size="xs" />
            <span className="text-xs text-[var(--muted-foreground)]">
              <span className="text-[var(--foreground)] font-semibold">
                {review.username}
              </span>{" "}
              · {timeAgo(review.created_at)}
            </span>
          </div>
          <p className="text-sm text-[var(--secondary-foreground)] leading-relaxed line-clamp-2">
            {review.body}
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 flex items-center gap-4 border-t border-[var(--border)] mt-auto">
        <button
          onClick={() => onVote(review.id, "up")}
          aria-label={`Upvote (${up})`}
          aria-pressed={userVote === "up"}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 ${
            userVote === "up"
              ? "text-[var(--accent)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--accent)]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={userVote === "up" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
          {up}
        </button>
        <button
          onClick={() => onVote(review.id, "down")}
          aria-label={`Downvote (${down})`}
          aria-pressed={userVote === "down"}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all hover:scale-105 ${
            userVote === "down"
              ? "text-blue-400"
              : "text-[var(--muted-foreground)] hover:text-blue-400"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill={userVote === "down" ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
          {down}
        </button>
        <button
          onClick={() => setShowReplies(!showReplies)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ml-auto ${
            showReplies
              ? "text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      {showReplies && (
        <div className="border-t border-[var(--border)] px-4 pt-3 pb-4 flex flex-col gap-3 bg-[var(--muted)]/40">
          {replies.map((r) => (
            <div key={r.id} className="flex gap-2.5 items-start">
              <Avt initials={initials(r.username)} size="xs" />
              <div className="flex-1 bg-[var(--card)] rounded-xl px-3 py-2 border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--foreground)] mb-0.5">
                  {r.username}
                </p>
                <p className="text-xs text-[var(--secondary-foreground)] leading-relaxed">
                  {r.body}
                </p>
              </div>
            </div>
          ))}
          {replies.length === 0 && (
            <p className="text-xs text-[var(--muted-foreground)] text-center py-2">
              No replies yet. Be first!
            </p>
          )}
          <div className="flex gap-2 items-center">
            <Avt initials="ME" size="xs" />
            <div className="flex-1 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitReply()
                }}
                placeholder="Write a reply…"
                className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-full px-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"
              />
              <button
                onClick={submitReply}
                className="px-3 py-1.5 bg-[var(--accent)] text-black text-xs font-bold rounded-full hover:opacity-90 transition-opacity"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Write Review Modal ───────────────────────────────────────────────────────

function WriteReviewModal({
  onClose,
  onSubmit,
  movies,
}: {
  onClose: () => void
  onSubmit: (movieId: string, rating: number, body: string) => void
  movies: Movie[]
}) {
  const [rating, setRating] = useState(0)

  const [body, setBody] = useState("")

  const [movieId, setMovieId] = useState("")

  const [query, setQuery] = useState("")

  const [open, setOpen] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const ref = useFocusTrap(true)

  const selected = movies.find((m) => m.id === movieId)

  const matches = query.trim()
    ? movies.filter((m) =>
        (m.title + " " + m.year)
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : movies

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose()

    window.addEventListener("keydown", esc)

    return () => window.removeEventListener("keydown", esc)
  }, [onClose])

  const submit = () => {
    const { data, errors } = parseForm(reviewSchema, {
      movie_id: movieId,
      rating,
      body,
    })

    setFieldErrors(errors)

    if (Object.keys(errors).length) return

    onSubmit(data.movie_id, data.rating, data.body)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Write a review"
        className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="font-display font-900 text-2xl text-[var(--foreground)] mb-5">
          WRITE A REVIEW
        </h2>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">
              Movie
            </label>
            <input
              type="text"
              value={selected ? selected.title : query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
                setFieldErrors((f) => ({ ...f, movie_id: "" }))
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search movies…"
              aria-invalid={!!fieldErrors.movie_id}
              className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            {open && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-2xl">
                {matches.length === 0 && (
                  <li className="px-3 py-2 text-sm text-[var(--muted-foreground)]">
                    No movies found
                  </li>
                )}
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setMovieId(m.id)
                        setQuery("")
                        setOpen(false)
                        setFieldErrors((f) => ({ ...f, movie_id: "" }))
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
                    >
                      <img
                        src={m.poster}
                        alt=""
                        className="w-8 h-11 object-cover rounded"
                      />
                      <span className="flex-1">
                        {m.title}{" "}
                        <span className="text-[var(--muted-foreground)]">
                          ({m.year})
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fieldErrors.movie_id && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {fieldErrors.movie_id}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">
              Your Rating
            </label>
            <div className="flex items-center gap-3">
              <InteractiveStars
                value={rating}
                onChange={(v) => {
                  setRating(v)
                  setFieldErrors((f) => ({ ...f, rating: "" }))
                }}
              />
              {rating > 0 && (
                <span className="text-sm font-bold text-[var(--accent)]">
                  {rating}/10
                </span>
              )}
            </div>
            {fieldErrors.rating && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {fieldErrors.rating}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5 block">
              Review
            </label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                setFieldErrors((f) => ({ ...f, body: "" }))
              }}
              rows={4}
              placeholder="What did you think?"
              aria-invalid={!!fieldErrors.body}
              className="w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors resize-none"
            />
            {fieldErrors.body && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {fieldErrors.body}
              </p>
            )}
          </div>
          <button
            onClick={submit}
            disabled={!movieId || !rating || !body.trim()}
            className="btn-parallelogram w-full py-3 bg-[var(--accent)] text-black font-bold transition-all text-sm tracking-wide disabled:opacity-40 hover:opacity-90"
          >
            PUBLISH REVIEW
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Poll Card ────────────────────────────────────────────────────────────────

function PollCard({
  poll,
  myVote,
  onVote,
}: {
  poll: Poll
  myVote: number | null
  onVote: (pollId: string, idx: number) => void
}) {
  const closed = poll.status === "closed"

  const optVotes = poll.options.map((o, i) => o.votes + (myVote === i ? 1 : 0))

  const total = optVotes.reduce((a, b) => a + b, 0)

  const maxVotes = Math.max(...optVotes)

  const castVote = (i: number) => {
    if (myVote !== null || closed) return

    onVote(poll.id, i)
  }

  return (
    <div
      className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent)]/25 transition-all ${
        closed ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">
            Admin Poll
          </p>
          <h3 className="font-display font-800 text-xl text-[var(--foreground)] leading-tight">
            {poll.question}
          </h3>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-[var(--muted-foreground)]">
            {closed ? "Status" : "Closes"}
          </p>
          <p
            className={`text-sm font-bold ${
              closed
                ? "text-[var(--muted-foreground)]"
                : "text-[var(--foreground)]"
            }`}
          >
            {closed ? "Closed" : fmtCloses(poll.closes)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {poll.options.map((opt, i) => {
          const pct = total > 0 ? Math.round((optVotes[i] / total) * 100) : 0

          const isWinner = myVote !== null && optVotes[i] === maxVotes

          const isVoted = myVote === i

          return (
            <button
              key={opt.id}
              onClick={() => castVote(i)}
              disabled={myVote !== null || closed}
              aria-pressed={isVoted}
              className={`relative w-full text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                isVoted
                  ? "border-[var(--accent)] bg-[var(--accent)]/5"
                  : myVote !== null || closed
                    ? "border-[var(--border)] cursor-default"
                    : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--muted)]"
              }`}
            >
              {myVote !== null && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                    isWinner ? "bg-[var(--accent)]/15" : "bg-[var(--muted)]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center gap-3 px-4 py-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isVoted
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isVoted && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-foreground)]" />
                  )}
                </div>
                <span
                  className={`text-sm flex-1 font-medium ${
                    isVoted
                      ? "text-[var(--accent)]"
                      : isWinner && myVote !== null
                        ? "text-[var(--foreground)] font-bold"
                        : "text-[var(--foreground)]"
                  }`}
                >
                  {opt.label}
                </span>
                {myVote !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tabular-nums text-[var(--muted-foreground)]">
                      {pct}%
                    </span>
                    {isWinner && (
                      <svg
                        className="w-3.5 h-3.5 text-[var(--accent)]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-[var(--muted-foreground)] mt-3">
        {total.toLocaleString()} votes ·{" "}
        {closed
          ? "Voting closed"
          : myVote === null
            ? "Cast your vote"
            : "Results shown"}
      </p>
    </div>
  )
}

// ─── Library Card ─────────────────────────────────────────────────────────────

function LibCard({
  movie,
  saved,
  onToggle,
}: {
  movie: Movie
  saved: boolean
  onToggle: () => void
}) {
  return (
    <div className="group relative cursor-pointer">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] relative">
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.style.opacity = "0"
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-xs font-bold leading-tight">
            {movie.title}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[var(--star)] text-xs font-bold">
              ★ {movie.rating}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
              }}
              aria-label={saved ? "Remove from favorites" : "Add to favorites"}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                saved
                  ? "bg-[var(--accent)]"
                  : "bg-white/10 hover:bg-[var(--accent)]"
              }`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill={saved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/70 text-white font-medium">
            {movie.genre}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePage({
  movies,
  reviews,
  threads,
  userVotes,
  onVote,
  onReply,
  polls,
  pollVotes,
  onPollVote,
  favorites,
  onToggleFavorite,
  onWriteReview,
  announcements,
}: {
  movies: Movie[]
  reviews: Review[]
  threads: Record<string, Reply[]>
  userVotes: Record<string, "up" | "down" | null>
  onVote: (id: string, dir: "up" | "down") => void
  onReply: (id: string, body: string) => void

  polls: Poll[]
  pollVotes: Record<string, number>
  onPollVote: (pollId: string, idx: number) => void

  favorites: string[]
  onToggleFavorite: (id: string) => void
  onWriteReview: (movieId: string, rating: number, body: string) => void

  announcements: Announcement[]
}) {
  const [genre, setGenre] = useState("All")

  const [year, setYear] = useState("All")

  const [rating, setRating] = useState("All")

  const [query, setQuery] = useState("")

  const [showWriteReview, setShowWriteReview] = useState(false)

  const [showSearchReviews, setShowSearchReviews] = useState(false)

  const [reviewQuery, setReviewQuery] = useState("")

  const [visibleCount, setVisibleCount] = useState(50)

  // Reset pagination whenever filters/search change so "Show more" starts fresh.

  useEffect(() => {
    setVisibleCount(50)
  }, [genre, year, rating, query])

  const filtered = movies.filter((m) => {
    if (genre !== "All" && m.genre !== genre) return false

    if (year !== "All") {
      if (year === "Pre-2000" && m.year >= 2000) return false

      if (year === "2000s" && (m.year < 2000 || m.year >= 2010)) return false

      if (year === "2010s" && (m.year < 2010 || m.year >= 2020)) return false

      if (!isNaN(Number(year)) && m.year !== Number(year)) return false
    }

    if (rating !== "All" && m.rating < parseFloat(rating)) return false

    if (
      query &&
      !m.title.toLowerCase().includes(query.toLowerCase()) &&
      !m.director.toLowerCase().includes(query.toLowerCase())
    )
      return false

    return true
  })

  const filteredReviews = reviewQuery.trim()
    ? reviews.filter((r) => {
        const movie = movies.find((m) => m.id === r.movie_id)

        const hay = (
          r.body +
          " " +
          r.username +
          " " +
          (movie?.title ?? "")
        ).toLowerCase()

        return hay.includes(reviewQuery.trim().toLowerCase())
      })
    : reviews

  return (
    <>
      {showWriteReview && (
        <WriteReviewModal
          onClose={() => setShowWriteReview(false)}
          onSubmit={(movieId, rating, body) => {
            onWriteReview(movieId, rating, body)
            setShowWriteReview(false)
          }}
          movies={movies}
        />
      )}

      <HeroBanner movies={movies} reviews={reviews} />

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
          <div className="flex flex-col gap-2">
            {announcements.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="bg-[var(--card)] border border-[var(--border)] border-l-4 border-l-[var(--accent)] rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">
                    Announcement
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
                <p className="font-display font-700 text-sm text-[var(--foreground)]">
                  {a.title}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <MovieRow
          title="WATCHING NEXT..."
          pre="Now Showing"
          movieIds={TRENDING_IDS}
          movies={movies}
          favorites={favorites}
          onToggleFavorite={onToggleFavorite}
        />
      </section>

      {/* Latest Reviews */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end gap-4 mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">
              Member Writing
            </p>
            <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">
              LATEST REVIEWS
            </h2>
          </div>
          <span className="flex-1 h-px bg-[var(--border)] mb-2" />
          <button
            onClick={() => setShowSearchReviews((s) => !s)}
            className="btn-parallelogram mb-1 flex items-center gap-1.5 px-4 py-2 border border-[var(--border)] bg-transparent text-[var(--foreground)] text-sm font-bold hover:bg-[var(--muted)] transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            Search Reviews
          </button>
          <button
            onClick={() => setShowWriteReview(true)}
            className="btn-parallelogram mb-1 flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Write Review
          </button>
        </div>
        {showSearchReviews && (
          <div className="mb-5">
            <input
              type="text"
              value={reviewQuery}
              onChange={(e) => setReviewQuery(e.target.value)}
              placeholder="Search reviews by text, member, or movie…"
              autoFocus
              className="w-full sm:max-w-md px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              replies={threads[r.id] || []}
              userVote={userVotes[r.id] ?? null}
              onVote={onVote}
              onReply={onReply}
              movies={movies}
            />
          ))}
        </div>
        {showSearchReviews &&
          reviewQuery.trim() &&
          filteredReviews.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] mt-4">
              No reviews match "{reviewQuery}".
            </p>
          )}
      </section>

      {/* Polls */}
      <section
        id="polls"
        className="border-y border-[var(--border)] bg-[var(--muted)]/60"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <SectionHeader label="MOVIE POLLS" pre="Vote Now" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {polls.map((p) => (
              <PollCard
                key={p.id}
                poll={p}
                myVote={pollVotes[p.id] ?? null}
                onVote={onPollVote}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Library */}
      <section id="library" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <SectionHeader label="MOVIE LIBRARY" pre="Explore" />
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or director…"
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          {[
            { opts: GENRES, val: genre, set: setGenre, ph: "Genre" },
            { opts: YEARS, val: year, set: setYear, ph: "Year" },
            { opts: RATINGS, val: rating, set: setRating, ph: "Rating" },
          ].map(({ opts, val, set, ph }) => (
            <select
              key={ph}
              value={val}
              onChange={(e) => set(e.target.value)}
              className="px-3 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <option value="All">{ph}: All</option>
              {opts.slice(1).map((o) => (
                <option key={o} value={o.replace("+", "")}>
                  {ph}: {o}
                </option>
              ))}
            </select>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filtered.slice(0, visibleCount).map((m) => (
            <LibCard
              key={m.id}
              movie={m}
              saved={favorites.includes(m.id)}
              onToggle={() => onToggleFavorite(m.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <p className="font-display font-900 text-3xl text-[var(--muted-foreground)]">
                NO RESULTS
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-2">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
        {filtered.length > visibleCount && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + 50)}
              className="btn-parallelogram inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Show More
              <span className="text-xs font-bold opacity-70">
                ({filtered.length - visibleCount} more)
              </span>
            </button>
          </div>
        )}
      </section>
    </>
  )
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

function CalendarPage({
  screenings,
  push,
}: {
  screenings: Screening[]
  push: (t: string) => void
}) {
  const today = new Date()

  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  })

  const [selected, setSelected] = useState<number | null>(null)

  const [joined, setJoined] = useState<Set<string>>(new Set())

  const [attendees, setAttendees] = useState<Record<string, string[]>>({})

  const [viewing, setViewing] = useState<string | null>(null)

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const firstDay = new Date(view.y, view.m, 1).getDay()

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const dayOf = (date: string) => new Date(date + "T00:00:00").getDate()

  const inMonth = screenings

    .filter((s) => {
      const d = new Date(s.date + "T00:00:00")

      return d.getFullYear() === view.y && d.getMonth() === view.m
    })

    .sort((a, b) => a.date.localeCompare(b.date))

  const eventByDay: Record<number, Screening[]> = {}

  inMonth.forEach((s) => {
    const day = dayOf(s.date)

    ;(eventByDay[day] ||= []).push(s)
  })

  const selectedEvent =
    selected !== null
      ? (inMonth.find((s) => dayOf(s.date) === selected) ?? null)
      : null

  const isToday = (day: number) =>
    view.y === today.getFullYear() &&
    view.m === today.getMonth() &&
    day === today.getDate()

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const m = v.m + delta

      if (m < 0) return { y: v.y - 1, m: 11 }

      if (m > 11) return { y: v.y + 1, m: 0 }

      return { y: v.y, m }
    })

    setSelected(null)
  }

  const toggleJoin = (id: string) => {
    if (joined.has(id)) {
      setJoined((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })

      setAttendees((prev) => ({
        ...prev,
        [id]: (prev[id] ?? []).filter((u) => u !== "You"),
      }))

      push("You left the screening.")
    } else {
      setJoined((prev) => new Set(prev).add(id))

      setAttendees((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), "You"] }))

      push("You're in — see you there!")
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="flex items-end justify-between gap-4 mb-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">
            Screening Calendar
          </p>
          <h2 className="font-display font-900 text-4xl sm:text-5xl leading-none text-[var(--foreground)]">
            {MONTH_NAMES[view.m]} {view.y}
          </h2>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              setView({ y: today.getFullYear(), m: today.getMonth() })
              setSelected(null)
            }}
            className="px-3 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            TODAY
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--card)] flex items-center justify-center text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <div className="grid grid-cols-7 mb-1">
            {days.map((d) => (
              <div
                key={d}
                className="text-center text-[11px] font-bold text-[var(--muted-foreground)] py-2 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const events = day ? eventByDay[day] || [] : []

              const isSelected = day === selected

              const todayCell = day ? isToday(day) : false

              return (
                <button
                  key={i}
                  onClick={() => day && setSelected(isSelected ? null : day)}
                  disabled={!day}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                    !day ? "cursor-default" : ""
                  } ${
                    isSelected
                      ? "bg-[var(--accent)] text-black scale-[1.05] shadow-lg"
                      : events.length
                        ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 hover:bg-[var(--accent)]/20 text-[var(--foreground)]"
                        : day
                          ? "hover:bg-[var(--muted)] text-[var(--foreground)]"
                          : ""
                  } ${
                    todayCell && !isSelected
                      ? "ring-1 ring-[var(--accent)]"
                      : ""
                  }`}
                >
                  {day && (
                    <>
                      <span
                        className={`font-display font-700 text-sm leading-none ${
                          isSelected
                            ? "text-black"
                            : events.length
                              ? "text-[var(--accent)]"
                              : "text-[var(--foreground)]"
                        }`}
                      >
                        {day}
                      </span>
                      {events.length > 0 && !isSelected && (
                        <div className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1" />
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {selectedEvent ? (
            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-2xl p-5 mb-2">
              <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-3">
                Selected Screening
              </p>
              {selectedEvent.poster && (
                <img
                  src={selectedEvent.poster}
                  alt={selectedEvent.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.opacity = "0"
                  }}
                  className="w-full aspect-[16/9] object-cover rounded-xl bg-[var(--muted)] mb-3"
                />
              )}
              <h3 className="font-display font-800 text-xl text-[var(--foreground)] leading-tight mb-3">
                {selectedEvent.title}
              </h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg
                    className="w-4 h-4 text-[var(--accent)] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {selectedEvent.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg
                    className="w-4 h-4 text-[var(--accent)] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {selectedEvent.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-foreground)]">
                  <svg
                    className="w-4 h-4 text-[var(--accent)] flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {selectedEvent.date}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => toggleJoin(selectedEvent.id)}
                  className={`btn-parallelogram flex-1 py-2 text-sm font-bold transition-opacity hover:opacity-90 ${
                    joined.has(selectedEvent.id)
                      ? "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]"
                      : "bg-[var(--accent)] text-black"
                  }`}
                >
                  {joined.has(selectedEvent.id) ? "Leave" : "Join"}
                </button>
                <button
                  onClick={() => setViewing(selectedEvent.id)}
                  className="btn-parallelogram px-4 py-2 bg-transparent border border-[var(--accent)] text-[var(--accent)] text-sm font-bold hover:bg-[var(--accent)] hover:text-black transition-colors"
                >
                  View
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              Click a highlighted date to see details
            </p>
          )}

          <h3 className="font-display font-700 text-lg text-[var(--foreground)]">
            Screenings — {MONTH_NAMES[view.m]}
          </h3>
          {inMonth.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)]">
              No screenings this month.
            </p>
          )}
          {inMonth.map((e) => {
            const { day, month } = fmtDate(e.date)

            const d = dayOf(e.date)

            return (
              <button
                key={e.id}
                onClick={() => setSelected(selected === d ? null : d)}
                className={`text-left bg-[var(--card)] border rounded-xl p-4 hover:border-[var(--accent)]/40 transition-all group ${
                  selected === d
                    ? "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                    : "border-[var(--border)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center flex-shrink-0">
                    <div className="font-display font-900 text-2xl text-[var(--accent)] leading-none">
                      {day}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] font-medium">
                      {month}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-tight truncate">
                      {e.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                      {e.location}
                    </p>
                    <p className="text-xs text-[var(--accent)] mt-0.5">
                      {e.time}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {viewing &&
        (() => {
          const ev = screenings.find((s) => s.id === viewing)

          const list = attendees[viewing] ?? []

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setViewing(null)}
            >
              <div
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-1">
                      Attendees
                    </p>
                    <h3 className="font-display font-800 text-lg text-[var(--foreground)] leading-tight">
                      {ev?.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setViewing(null)}
                    aria-label="Close"
                    className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {list.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] py-4">
                    No one has joined yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {list.map((u, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                          {u[0]}
                        </div>
                        <span className="text-sm text-[var(--foreground)]">
                          {u}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })()}
    </div>
  )
}

// ─── Leaderboard Page ─────────────────────────────────────────────────────────

function LeaderboardPage({ leaderboard }: { leaderboard: LeaderboardRow[] }) {
  const [sortBy, setSortBy] = useState<"upvotes" | "reviews">("upvotes")

  const sorted = [...leaderboard].sort((a, b) => b[sortBy] - a[sortBy])

  const podium = sorted.length >= 3 ? [sorted[1], sorted[0], sorted[2]] : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <SectionHeader label="LEADERBOARD" pre="Club Rankings" />

      <div className="flex gap-1.5 mb-8 p-1 bg-[var(--muted)] rounded-full w-fit border border-[var(--border)]">
        {(["upvotes", "reviews"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`px-5 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all ${
              sortBy === s
                ? "bg-[var(--accent)] text-black shadow"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {s === "upvotes" ? "Most Upvotes" : "Most Reviews"}
          </button>
        ))}
      </div>

      {/* Podium */}
      {podium && (
        <div className="grid grid-cols-3 gap-2 mb-10 items-end">
          {podium.map((member, pi) => {
            const actualRank = pi === 0 ? 2 : pi === 1 ? 1 : 3

            const podiumH = ["pb-6 pt-10", "pb-8 pt-16", "pb-4 pt-8"][pi]

            const medal = ["🥈", "🥇", "🥉"][pi]

            const ringColor = [
              "from-slate-400 to-slate-600",
              "from-amber-400 to-amber-600",
              "from-orange-400 to-orange-600",
            ][pi]

            return (
              <div key={member.username} className="flex flex-col items-center">
                <div className="text-2xl mb-2">{medal}</div>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${ringColor} p-0.5 mb-2`}
                >
                  <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center">
                    <span className="font-display font-900 text-sm sm:text-base text-[var(--foreground)]">
                      {initials(member.username)}
                    </span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-[var(--foreground)] text-center leading-tight">
                  {member.username}
                </p>
                <Badge label={badgeFor(member.reviews)} />
                <div
                  className={`w-full ${podiumH} mt-3 rounded-t-2xl flex items-start justify-center pt-3 ${
                    pi === 1
                      ? "bg-[var(--accent)]/15 border border-[var(--accent)]/25"
                      : "bg-[var(--muted)] border border-[var(--border)]"
                  }`}
                >
                  <span
                    className={`font-display font-900 text-4xl sm:text-5xl ${
                      pi === 1
                        ? "text-[var(--accent)]"
                        : pi === 0
                          ? "text-slate-400"
                          : "text-orange-400"
                    }`}
                  >
                    #{actualRank}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--muted)]/50">
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            #
          </span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
            Member
          </span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider hidden sm:block text-right">
            Reviews
          </span>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">
            Upvotes
          </span>
        </div>
        {sorted.map((m, i) => (
          <div
            key={m.username}
            className={`grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 items-center px-5 py-3.5 transition-colors hover:bg-[var(--muted)]/50 ${
              i < sorted.length - 1 ? "border-b border-[var(--border)]" : ""
            }`}
          >
            <span
              className={`font-display font-900 text-lg ${
                i === 0
                  ? "text-[var(--accent)]"
                  : i === 1
                    ? "text-slate-400"
                    : i === 2
                      ? "text-orange-400"
                      : "text-[var(--muted-foreground)]"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex items-center gap-2.5 min-w-0">
              <Avt initials={initials(m.username)} size="xs" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {m.username}
                </p>
                <Badge label={badgeFor(m.reviews)} />
              </div>
            </div>
            <span className="text-sm font-bold text-[var(--foreground)] hidden sm:block text-right">
              {m.reviews}
            </span>
            <span className="text-sm font-bold text-[var(--accent)] text-right">
              {m.upvotes.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

function ProfilePage({
  movies,
  reviews,
  vault,
  members,
  following,
  onToggleFollow,
  session,
  onUploadAvatar,
  onUpdateUsername,
}: {
  movies: Movie[]
  reviews: Review[]
  vault: Record<VaultTab, string[]>
  members: Profile[]
  following: string[]
  onToggleFollow: (id: string, username: string) => void
  session: Session | null
  onUploadAvatar: (file: File) => void
  onUpdateUsername: (username: string) => void
}) {
  const [tab, setTab] = useState<VaultTab>("watched")

  const [friendQ, setFriendQ] = useState("")

  const [editing, setEditing] = useState(false)

  const [nameDraft, setNameDraft] = useState("")

  const fileRef = useRef<HTMLInputElement>(null)

  const vaultMovies = vault[tab]
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => Boolean(m))

  const otherMembers = members.filter((m) => m.id !== session?.user.id)

  const filteredMembers = otherMembers.filter(
    (f) => !friendQ || f.username.toLowerCase().includes(friendQ.toLowerCase()),
  )

  const username = session?.user.username ?? "CinemaVault"

  const netUpvotes = reviews.reduce((a, r) => a + r.upvotes - r.downvotes, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16">
      {/* Banner */}
      <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-[var(--muted)]">
        <img
          src="https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=1400&h=300&fit=crop&auto=format"
          alt="Profile banner"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/70 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8 -mt-8 px-2">
        <div className="relative w-20 h-20 flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--primary)] flex items-center justify-center border-4 border-[var(--background)] shadow-xl overflow-hidden">
            {session?.user.avatar_url ? (
              <img
                src={session.user.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display font-900 text-2xl text-[var(--accent-foreground)]">
                {initials(username)}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--accent)] flex items-center justify-center shadow"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 019.07 4h5.86a2 2 0 011.664.89l.812 1.22A2 2 0 0019.07 7H21a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onUploadAvatar(f)
              e.currentTarget.value = ""
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {editing ? (
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateUsername(nameDraft.trim())
                    setEditing(false)
                  }
                }}
                autoFocus
                className="font-display font-900 text-3xl sm:text-4xl text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1 w-full max-w-xs focus:outline-none focus:border-[var(--accent)]"
              />
            ) : (
              <>
                <h1 className="font-display font-900 text-3xl sm:text-4xl text-[var(--foreground)]">
                  {username}
                </h1>
                <Badge label={badgeFor(reviews.length)} />
              </>
            )}
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Member since Jan 2023 · Brooklyn, NY
          </p>
        </div>
        {editing ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                onUpdateUsername(nameDraft.trim())
                setEditing(false)
              }}
              disabled={!nameDraft.trim()}
              className="btn-parallelogram px-5 py-2 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-parallelogram px-5 py-2 bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-sm font-semibold hover:border-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setNameDraft(username)
              setEditing(true)
            }}
            className="btn-parallelogram px-5 py-2 bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] text-sm font-semibold hover:border-[var(--accent)] transition-colors flex-shrink-0"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { label: "Reviews", val: String(reviews.length) },

          { label: "Upvotes", val: netUpvotes.toLocaleString() },

          { label: "Following", val: String(following.length) },

          {
            label: "Vault",
            val: String(
              vault.watched.length +
                vault.plantowatch.length +
                vault.favorites.length,
            ),
          },
        ].map(({ label, val }) => (
          <div
            key={label}
            className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 sm:p-4 text-center hover:border-[var(--accent)]/30 transition-colors"
          >
            <p className="font-display font-900 text-2xl sm:text-3xl text-[var(--foreground)]">
              {val}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cinema Vault */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <svg
              className="w-5 h-5 text-[var(--accent)]"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path
                fillRule="evenodd"
                d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h2 className="font-display font-900 text-2xl text-[var(--foreground)]">
              CINEMA VAULT
            </h2>
          </div>

          <div className="flex gap-1 mb-5 p-1 bg-[var(--muted)] rounded-full w-fit border border-[var(--border)]">
            {(["watched", "plantowatch", "favorites"] as VaultTab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    tab === t
                      ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm border border-[var(--border)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t === "watched"
                    ? "Watched"
                    : t === "plantowatch"
                      ? "Plan to Watch"
                      : "★ Favorites"}
                </button>
              ),
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {vaultMovies.map((m) => (
              <div key={m.id} className="group cursor-pointer">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-[var(--muted)] relative">
                  <img
                    src={m.poster}
                    alt={m.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0"
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                  />
                  {tab === "favorites" && (
                    <div className="absolute top-1.5 right-1.5 text-[var(--star)] text-sm drop-shadow">
                      ★
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-[var(--foreground)] mt-1.5 truncate">
                  {m.title}
                </p>
                <p className="text-[10px] font-bold text-[var(--star)]">
                  ★ {m.rating}
                </p>
              </div>
            ))}
            {vaultMovies.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] col-span-full py-8 text-center">
                Nothing here yet.
              </p>
            )}
          </div>

          {/* Recent Reviews */}
          <h2 className="font-display font-900 text-2xl text-[var(--foreground)] mb-4">
            RECENT REVIEWS
          </h2>
          <div className="flex flex-col gap-3">
            {reviews.slice(0, 3).map((r) => {
              const m = movies.find((mv) => mv.id === r.movie_id)

              if (!m) return null

              return (
                <div
                  key={r.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex gap-3 hover:border-[var(--accent)]/30 transition-colors"
                >
                  <img
                    src={m.poster}
                    alt={m.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0"
                    }}
                    className="w-12 h-[68px] object-cover rounded-lg flex-shrink-0 bg-[var(--muted)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="font-display font-700 text-sm text-[var(--foreground)] truncate">
                          {m.title}
                        </p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">
                          {m.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StarRating rating={r.rating} />
                        <span className="text-xs font-bold text-[var(--accent)]">
                          {r.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--secondary-foreground)] line-clamp-2 leading-relaxed">
                      {r.body}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                      <span>{timeAgo(r.created_at)}</span>
                      <span>↑ {r.upvotes}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Find Friends */}
          <div>
            <h2 className="font-display font-900 text-xl text-[var(--foreground)] mb-3">
              FIND FRIENDS
            </h2>
            <div className="relative mb-3">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={friendQ}
                onChange={(e) => setFriendQ(e.target.value)}
                placeholder="Search members…"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-2">
              {filteredMembers.slice(0, 6).map((f) => (
                <div
                  key={f.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-2.5 hover:border-[var(--accent)]/30 transition-colors"
                >
                  <Avt initials={initials(f.username)} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {f.username}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)]">
                      {f.role}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleFollow(f.id, f.username)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      following.includes(f.id)
                        ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                        : "border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {following.includes(f.id) ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <h3 className="font-display font-700 text-base text-[var(--foreground)] mb-3">
              ACTIVITY STATS
            </h3>
            {[
              { label: "Avg Rating Given", val: "8.4 / 10" },

              { label: "Favourite Genre", val: "Drama" },

              { label: "Most Active Month", val: "March" },

              { label: "Reviews This Year", val: "34" },

              {
                label: "Films in Vault",
                val: String(
                  vault.watched.length +
                    vault.plantowatch.length +
                    vault.favorites.length,
                ),
              },

              { label: "Polls Voted", val: "18" },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
              >
                <span className="text-xs text-[var(--muted-foreground)]">
                  {label}
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Genre chart */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
            <h3 className="font-display font-700 text-base text-[var(--foreground)] mb-4">
              GENRE BREAKDOWN
            </h3>
            {[
              { g: "Drama", pct: 42, n: 62 },
              { g: "Thriller", pct: 22, n: 32 },
              { g: "Sci-Fi", pct: 16, n: 24 },
              { g: "Romance", pct: 12, n: 17 },
              { g: "Horror", pct: 8, n: 12 },
            ].map(({ g, pct, n }) => (
              <div key={g} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-[var(--foreground)]">
                    {g}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {n} films
                  </span>
                </div>
                <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Gate ───────────────────────────────────────────────────────────────

// Code-only gate. Anyone signed in can enter the club code to unlock the console;

// on success we also promote the signed-in user to admin so admin writes pass RLS.

function AdminGate({
  session,
  onUnlock,
  onSignIn,
}: {
  session: Session | null
  onUnlock: () => void
  onSignIn: () => void
}) {
  const [code, setCode] = useState("")

  const [error, setError] = useState(false)

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
        <p className="font-display font-900 text-4xl text-[var(--muted-foreground)]">
          ADMIN
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mt-2">
          Sign in to unlock the admin console.
        </p>
        <button
          onClick={onSignIn}
          className="btn-parallelogram mt-6 px-6 py-2.5 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-opacity text-sm tracking-wide"
        >
          SIGN IN
        </button>
      </div>
    )
  }

  const submit = () => {
    if (code.trim() === ADMIN_CODE) onUnlock()
    else setError(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-16 text-center">
      <p className="font-display font-900 text-4xl text-[var(--muted-foreground)]">
        ADMIN ONLY
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mt-2">
        Enter the club code to access the admin console.
      </p>
      <div className="max-w-xs mx-auto mt-6 flex gap-2">
        <input
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError(false)
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Admin code"
          autoFocus
          className="flex-1 min-w-0 bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={submit}
          className="btn-parallelogram px-5 py-2 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          ENTER
        </button>
      </div>
      {error && (
        <p className="text-xs text-[var(--accent)] mt-3">Wrong code.</p>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

function AdminPage({
  screenings,
  onAddScreening,
  onDeleteScreening,
  polls,
  onAddPoll,
  onTogglePoll,
  onDeletePoll,
  reviews,
  movies,
  deletedMovies,
  threads,
  onDeleteReview,
  onAddMovie,
  onDeleteMovie,
  onRestoreMovie,
  onDeleteComment,
  onUploadPoster,
  announcements,
  members,
  onAddAnnouncement,
  onDeleteAnnouncement,
  onSetMemberRole,
  onSetReviewFeatured,
  session,
}: {
  screenings: Screening[]
  onAddScreening: (s: Omit<Screening, "id">) => void
  onDeleteScreening: (id: string) => void

  polls: Poll[]
  onAddPoll: (question: string, closes: string, options: string[]) => void
  onTogglePoll: (id: string) => void
  onDeletePoll: (id: string) => void

  reviews: Review[]
  movies: Movie[]
  deletedMovies: Movie[]
  threads: Record<string, Reply[]>
  onDeleteReview: (id: string) => void

  onAddMovie: (m: {
    title: string
    year: number
    genre: string
    rating: number
    director: string
    poster: string
  }) => void

  onDeleteMovie: (id: string) => void
  onRestoreMovie: (id: string) => void
  onDeleteComment: (id: string) => void

  onUploadPoster: (file: File) => Promise<string>

  announcements: Announcement[]
  members: Profile[]

  onAddAnnouncement: (a: { title: string body: string }) => void
  onDeleteAnnouncement: (id: string) => void

  onSetMemberRole: (userId: string, role: "member" | "admin") => void
  onSetReviewFeatured: (id: string, featured: boolean, backgroundUrl?: string) => void
  session: Session | null
}) {
  // Screening form

  const [sTitle, setSTitle] = useState("")

  // Background URL modal
  const [bgModalOpen, setBgModalOpen] = useState(false)
  const [bgReviewId, setBgReviewId] = useState("")
  const [bgUrl, setBgUrl] = useState("")

  const [sDate, setSDate] = useState("")

  const [sTime, setSTime] = useState("")

  const [sLoc, setSLoc] = useState("")

  const [sQuery, setSQuery] = useState("")

  const [sOpen, setSOpen] = useState(false)

  // Poll form

  const [pQuestion, setPQuestion] = useState("")

  const [pCloses, setPCloses] = useState("")

  const [pOptions, setPOptions] = useState(["", ""])

  // Movie form

  const [mTitle, setMTitle] = useState("")

  const [mYear, setMYear] = useState("")

  const [mGenre, setMGenre] = useState("Drama")

  const [mRating, setMRating] = useState("")

  const [mDirector, setMDirector] = useState("")

  const [mPoster, setMPoster] = useState("")

  const [sErrors, setSErrors] = useState<FieldErrors>({})

  const [pErrors, setPErrors] = useState<FieldErrors>({})

  const [mErrors, setMErrors] = useState<FieldErrors>({})

  const [uploading, setUploading] = useState(false)

  const posterRef = useRef<HTMLInputElement>(null)

  // Announcement form

  const [aTitle, setATitle] = useState("")

  const [aBody, setABody] = useState("")

  const [aErrors, setAErrors] = useState<FieldErrors>({})

  // Comments moderation filters

  const [cUser, setCUser] = useState("")

  const [cMovie, setCMovie] = useState("")

  const [cSort, setCSort] = useState<"recent" | "oldest">("recent")

  const inputCls =
    "w-full px-3 py-2.5 bg-[var(--muted)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none focus:border-[var(--accent)] transition-colors"

  const screeningMatches = movies

    .filter((m) => m.title.toLowerCase().includes(sQuery.trim().toLowerCase()))

    .slice(0, 8)

  const selectScreeningMovie = (m: Movie) => {
    setSTitle(m.title)
    setSQuery(m.title)
    setSOpen(false)

    setSErrors((f) => ({ ...f, title: "" }))
  }

  const addScreening = () => {
    const { data, errors } = parseForm(screeningSchema, {
      title: sTitle,
      date: sDate,
      time: sTime,
      location: sLoc,
    })

    setSErrors(errors)

    if (Object.keys(errors).length) return

    onAddScreening({
      title: data.title,
      date: data.date,
      time: data.time,
      location: data.location || "Streaming",
    })

    setSTitle("")
    setSDate("")
    setSTime("")
    setSLoc("")
    setSQuery("")
    setSOpen(false)
  }

  const addPoll = () => {
    const { data, errors } = parseForm(pollSchema, {
      question: pQuestion,
      closes: pCloses,
      options: pOptions,
    })

    setPErrors(errors)

    if (Object.keys(errors).length) return

    onAddPoll(data.question, data.closes || "TBD", data.options)

    setPQuestion("")
    setPCloses("")
    setPOptions(["", ""])
  }

  const setOpt = (i: number, v: string) => {
    setPOptions((prev) => prev.map((o, idx) => (idx === i ? v : o)))
    setPErrors((f) => ({ ...f, options: "" }))
  }

  const addOpt = () => {
    setPOptions((prev) => [...prev, ""])
    setPErrors((f) => ({ ...f, options: "" }))
  }

  const removeOpt = (i: number) => {
    setPOptions((prev) => prev.filter((_, idx) => idx !== i))
    setPErrors((f) => ({ ...f, options: "" }))
  }

  const addMovie = () => {
    const { data, errors } = parseForm(movieSchema, {
      title: mTitle,
      year: mYear,
      genre: mGenre,
      rating: mRating,
      director: mDirector,
      poster: mPoster,
    })

    setMErrors(errors)

    if (Object.keys(errors).length) return

    onAddMovie({
      title: data.title,
      year: data.year,
      genre: data.genre,
      rating: data.rating,
      director: data.director,
      poster: data.poster,
    })

    setMTitle("")
    setMYear("")
    setMGenre("Drama")
    setMRating("")
    setMDirector("")
    setMPoster("")
  }

  const addAnnouncement = () => {
    const { data, errors } = parseForm(announcementSchema, {
      title: aTitle,
      body: aBody,
    })

    setAErrors(errors)

    if (Object.keys(errors).length) return

    onAddAnnouncement({ title: data.title, body: data.body })

    setATitle("")
    setABody("")
  }

  const movieOptions = [...movies].sort((a, b) =>
    a.title.localeCompare(b.title),
  )

  const allComments = Object.entries(threads)

    .flatMap(([reviewId, list]) => list.map((c) => ({ ...c, reviewId })))

    .filter((c) => {
      if (
        cUser.trim() &&
        !c.username.toLowerCase().includes(cUser.trim().toLowerCase())
      )
        return false

      if (cMovie) {
        const review = reviews.find((r) => r.id === c.reviewId)

        if (!review || review.movie_id !== cMovie) return false
      }

      return true
    })

    .sort((a, b) =>
      cSort === "recent"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at),
    )

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <SectionHeader label="ADMIN CONSOLE" pre="Club Management" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Screenings */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
            SCREENINGS
          </h3>
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative">
              <input
                value={sQuery}
                onChange={(e) => {
                  setSQuery(e.target.value)
                  setSTitle("")
                  setSOpen(true)
                  setSErrors((f) => ({ ...f, title: "" }))
                }}
                onFocus={() => setSOpen(true)}
                onBlur={() => setTimeout(() => setSOpen(false), 120)}
                placeholder="Search movie library"
                aria-invalid={!!sErrors.title}
                className={inputCls}
              />
              {sOpen && screeningMatches.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg">
                  {screeningMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onMouseDown={() => selectScreeningMovie(m)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--muted)] transition-colors"
                    >
                      {m.poster ? (
                        <img
                          src={m.poster}
                          alt=""
                          className="w-7 h-10 object-cover rounded shrink-0"
                        />
                      ) : null}
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-[var(--foreground)] truncate">
                          {m.title}
                        </span>
                        <span className="block text-xs text-[var(--muted-foreground)]">
                          {m.year} · {m.genre}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {sErrors.title && (
                <p className="text-xs text-[var(--accent)] mt-1">
                  {sErrors.title}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={sDate}
                  onChange={(e) => {
                    setSDate(e.target.value)
                    setSErrors((f) => ({ ...f, date: "" }))
                  }}
                  aria-invalid={!!sErrors.date}
                  className={inputCls}
                />
                {sErrors.date && (
                  <p className="text-xs text-[var(--accent)] mt-1">
                    {sErrors.date}
                  </p>
                )}
              </div>
              <div>
                <input
                  value={sTime}
                  onChange={(e) => {
                    setSTime(e.target.value)
                    setSErrors((f) => ({ ...f, time: "" }))
                  }}
                  placeholder="Time (8:00 PM)"
                  aria-invalid={!!sErrors.time}
                  className={inputCls}
                />
                {sErrors.time && (
                  <p className="text-xs text-[var(--accent)] mt-1">
                    {sErrors.time}
                  </p>
                )}
              </div>
            </div>
            <input
              value={sLoc}
              onChange={(e) => setSLoc(e.target.value)}
              placeholder="Location"
              className={inputCls}
            />
            <button
              onClick={addScreening}
              disabled={!sTitle.trim() || !sDate || !sTime.trim()}
              className="btn-parallelogram py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              ADD SCREENING
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {[...screenings]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {s.title}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {s.date} · {s.time} · {s.location}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteScreening(s.id)}
                    className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            {screenings.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                No screenings.
              </p>
            )}
          </div>
        </div>

        {/* Polls */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
            POLLS
          </h3>
          <div className="flex flex-col gap-2 mb-4">
            <div>
              <input
                value={pQuestion}
                onChange={(e) => {
                  setPQuestion(e.target.value)
                  setPErrors((f) => ({ ...f, question: "" }))
                }}
                placeholder="Poll question"
                aria-invalid={!!pErrors.question}
                className={inputCls}
              />
              {pErrors.question && (
                <p className="text-xs text-[var(--accent)] mt-1">
                  {pErrors.question}
                </p>
              )}
            </div>
            <input
              type="date"
              value={pCloses}
              onChange={(e) => setPCloses(e.target.value)}
              className={inputCls}
            />
            {pOptions.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className={inputCls}
                />
                {pOptions.length > 2 && (
                  <button
                    onClick={() => removeOpt(i)}
                    className="px-2 text-[var(--muted-foreground)] hover:text-[var(--accent)] text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {pErrors.options && (
              <p className="text-xs text-[var(--accent)]">{pErrors.options}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={addOpt}
                className="px-3 py-1.5 text-xs font-semibold border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
              >
                + Add option
              </button>
              <button
                onClick={addPoll}
                disabled={
                  !pQuestion.trim() ||
                  pOptions.map((o) => o.trim()).filter(Boolean).length < 2
                }
                className="btn-parallelogram flex-1 py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                CREATE POLL
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {polls.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {p.question}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {p.options.length} options ·{" "}
                    {p.status === "open"
                      ? `Closes ${fmtCloses(p.closes)}`
                      : "Closed"}
                  </p>
                </div>
                <button
                  onClick={() => onTogglePoll(p.id)}
                  className={`text-xs font-semibold transition-colors ${
                    p.status === "open"
                      ? "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      : "text-[var(--accent)]"
                  }`}
                >
                  {p.status === "open" ? "Close" : "Reopen"}
                </button>
                <button
                  onClick={() => onDeletePoll(p.id)}
                  className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
            {polls.length === 0 && (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                No polls.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews moderation */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          REVIEWS
        </h3>
        <div className="flex flex-col gap-2">
          {reviews.map((r) => {
            const m = movies.find((mv) => mv.id === r.movie_id)

            return (
              <div
                key={r.id}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {m ? m.title : "Unknown"}{" "}
                    <span className="text-[var(--muted-foreground)] font-normal">
                      · {r.username} · {r.rating}/10
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {r.body}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (r.featured) {
                      onSetReviewFeatured(r.id, false)
                    } else {
                      setBgReviewId(r.id)
                      setBgUrl("")
                      setBgModalOpen(true)
                    }
                  }}
                  className={`text-xs font-semibold transition-colors ${
                    r.featured
                      ? "text-[var(--accent)] hover:text-[var(--muted-foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--accent)]"
                  }`}
                >
                  {r.featured ? "Unfeature" : "Feature"}
                </button>
                <button
                  onClick={() => onDeleteReview(r.id)}
                  className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  Delete
                </button>
              </div>
            )
          })}
          {reviews.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No reviews.
            </p>
          )}
        </div>
      </div>

      {/* Movies management */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          MOVIES
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          <div>
            <input
              value={mTitle}
              onChange={(e) => {
                setMTitle(e.target.value)
                setMErrors((f) => ({ ...f, title: "" }))
              }}
              placeholder="Movie title"
              aria-invalid={!!mErrors.title}
              className={inputCls}
            />
            {mErrors.title && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {mErrors.title}
              </p>
            )}
          </div>
          <div>
            <input
              value={mYear}
              onChange={(e) => {
                setMYear(e.target.value)
                setMErrors((f) => ({ ...f, year: "" }))
              }}
              placeholder="Year (e.g. 2025)"
              aria-invalid={!!mErrors.year}
              className={inputCls}
            />
            {mErrors.year && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {mErrors.year}
              </p>
            )}
          </div>
          <div>
            <select
              value={mGenre}
              onChange={(e) => {
                setMGenre(e.target.value)
                setMErrors((f) => ({ ...f, genre: "" }))
              }}
              aria-invalid={!!mErrors.genre}
              className={inputCls}
            >
              {GENRES.filter((g) => g !== "All").map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {mErrors.genre && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {mErrors.genre}
              </p>
            )}
          </div>
          <div>
            <input
              value={mRating}
              onChange={(e) => {
                setMRating(e.target.value)
                setMErrors((f) => ({ ...f, rating: "" }))
              }}
              placeholder="Rating (0–10)"
              aria-invalid={!!mErrors.rating}
              className={inputCls}
            />
            {mErrors.rating && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {mErrors.rating}
              </p>
            )}
          </div>
          <div>
            <input
              value={mDirector}
              onChange={(e) => setMDirector(e.target.value)}
              placeholder="Director"
              className={inputCls}
            />
          </div>
          <div>
            <div className="flex gap-2">
              <input
                value={mPoster}
                onChange={(e) => setMPoster(e.target.value)}
                placeholder="Poster URL (optional)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => posterRef.current?.click()}
                disabled={uploading}
                className="px-3 shrink-0 text-xs font-semibold border border-[var(--border)] rounded-lg text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
            <input
              ref={posterRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0]

                if (f) {
                  setUploading(true)

                  try {
                    setMPoster(await onUploadPoster(f))
                  } catch {
                    /* parent toasts */
                  } finally {
                    setUploading(false)
                  }
                }

                e.currentTarget.value = ""
              }}
            />
          </div>
        </div>
        <button
          onClick={addMovie}
          disabled={!mTitle.trim() || !mYear.trim() || !mRating.trim()}
          className="btn-parallelogram px-5 py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          ADD MOVIE
        </button>
        <div className="flex flex-col gap-2 mt-4 max-h-96 overflow-y-auto">
          {[...movies]
            .sort((a, b) => b.year - a.year)
            .map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {m.title}{" "}
                    <span className="text-[var(--muted-foreground)] font-normal">
                      · {m.year} · {m.genre} · ★ {m.rating}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {m.director}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteMovie(m.id)}
                  className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          {movies.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No movies.
            </p>
          )}
        </div>
      </div>

      {/* Deleted movies */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          DELETED MOVIES
        </h3>
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {[...deletedMovies]
            .sort((a, b) =>
              (b.deleted_at ?? "").localeCompare(a.deleted_at ?? ""),
            )
            .map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {m.title}{" "}
                    <span className="text-[var(--muted-foreground)] font-normal">
                      · {m.year} · {m.genre}
                    </span>
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {m.director}
                  </p>
                </div>
                <button
                  onClick={() => onRestoreMovie(m.id)}
                  className="text-xs font-semibold text-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                >
                  Add back
                </button>
              </div>
            ))}
          {deletedMovies.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No deleted movies.
            </p>
          )}
        </div>
      </div>

      {/* Comments moderation */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          COMMENTS
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input
            value={cUser}
            onChange={(e) => setCUser(e.target.value)}
            placeholder="Search by user"
            className={inputCls}
          />
          <select
            value={cMovie}
            onChange={(e) => setCMovie(e.target.value)}
            className={inputCls}
          >
            <option value="">All movies</option>
            {movieOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select
            value={cSort}
            onChange={(e) => setCSort(e.target.value as "recent" | "oldest")}
            className={inputCls}
          >
            <option value="recent">Most recent first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
          {allComments.map((c) => {
            const review = reviews.find((r) => r.id === c.reviewId)

            const movie = review && movies.find((m) => m.id === review.movie_id)

            return (
              <div
                key={c.id}
                className="flex items-start gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    on{" "}
                    <span className="text-[var(--foreground)] font-medium">
                      {movie ? movie.title : "Unknown"}
                    </span>{" "}
                    · {timeAgo(c.created_at)}
                  </p>
                  <p className="text-sm text-[var(--secondary-foreground)]">
                    <span className="font-semibold text-[var(--foreground)]">
                      {c.username}
                    </span>{" "}
                    · {c.body}
                  </p>
                </div>
                <button
                  onClick={() => onDeleteComment(c.id)}
                  className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
                >
                  Delete
                </button>
              </div>
            )
          })}
          {allComments.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No comments.
            </p>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          ANNOUNCEMENTS
        </h3>
        <div className="flex flex-col gap-2 mb-4">
          <div>
            <input
              value={aTitle}
              onChange={(e) => {
                setATitle(e.target.value)
                setAErrors((f) => ({ ...f, title: "" }))
              }}
              placeholder="Announcement title"
              aria-invalid={!!aErrors.title}
              className={inputCls}
            />
            {aErrors.title && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {aErrors.title}
              </p>
            )}
          </div>
          <div>
            <textarea
              value={aBody}
              onChange={(e) => {
                setABody(e.target.value)
                setAErrors((f) => ({ ...f, body: "" }))
              }}
              placeholder="Write the announcement…"
              rows={2}
              aria-invalid={!!aErrors.body}
              className={inputCls}
            />
            {aErrors.body && (
              <p className="text-xs text-[var(--accent)] mt-1">
                {aErrors.body}
              </p>
            )}
          </div>
          <button
            onClick={addAnnouncement}
            disabled={!aTitle.trim() || !aBody.trim()}
            className="btn-parallelogram w-fit px-5 py-2.5 bg-[var(--accent)] text-black text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            POST ANNOUNCEMENT
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                  {a.title}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {a.body}
                </p>
              </div>
              <button
                onClick={() => onDeleteAnnouncement(a.id)}
                className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors"
              >
                Delete
              </button>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No announcements.
            </p>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
          MEMBERS
        </h3>
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const isSelf = m.id === session?.user.id

            return (
              <div
                key={m.id}
                className="flex items-center gap-3 border border-[var(--border)] rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {m.username}{" "}
                    {isSelf && (
                      <span className="text-[var(--muted-foreground)] font-normal">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] capitalize">
                    {m.role}
                  </p>
                </div>
                <button
                  onClick={() =>
                    onSetMemberRole(
                      m.id,
                      m.role === "admin" ? "member" : "admin",
                    )
                  }
                  disabled={isSelf}
                  className={`text-xs font-semibold transition-colors disabled:opacity-40 ${
                    m.role === "admin"
                      ? "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      : "text-[var(--accent)]"
                  }`}
                >
                  {m.role === "admin" ? "Remove admin" : "Make admin"}
                </button>
              </div>
            )
          })}
          {members.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No members.
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Background URL modal */}
    {bgModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full mx-4">
          <h3 className="font-display font-800 text-lg text-[var(--foreground)] mb-4">
            FEATURE REVIEW
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Add custom background image URL for hero banner. Leave empty to use movie poster.
          </p>
          <input
            value={bgUrl}
            onChange={(e) => setBgUrl(e.target.value)}
            placeholder="Background image URL (optional)"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                onSetReviewFeatured(bgReviewId, true, bgUrl || undefined)
                setBgModalOpen(false)
              }}
              className="flex-1 btn-parallelogram px-4 py-2.5 bg-[var(--accent)] text-black font-bold hover:opacity-90 transition-all text-sm"
            >
              FEATURE
            </button>
            <button
              onClick={() => setBgModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  const pages: Page[] = ["home", "calendar", "leaderboard", "profile", "admin"]

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--muted)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="Absolute Cinema" className="h-6 w-auto" />
          </div>
          <div className="flex items-center gap-5 flex-wrap justify-center">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p)
                  window.scrollTo({ top: 0 })
                }}
                className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--accent)] transition-colors capitalize"
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            © 2026 Absolute Cinema · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home")

  const [dark, setDark] = usePersistentState("ac-dark", () => true)

  const [showSignIn, setShowSignIn] = useState(false)

  const { toasts, push } = useToast()

  useInitAuth()

  useRealtime()

  const session = useSession()

  const auth = useAuth()

  const [adminUnlocked, setAdminUnlocked] = usePersistentState(
    "ac-admin-unlock",
    () => false,
  )

  const movies = useMovies()

  const deletedMovies = useDeletedMovies()

  const reviews = useReviews()

  const threads = useThreads()

  const polls = usePolls()

  const screenings = useScreenings()

  const leaderboard = useLeaderboard()

  const members = useMembers()

  const vault = useVault()

  const following = useFollowing()

  const userVotes = useMyReviewVotes()

  const pollVotes = useMyPollVotes()

  const createReview = useCreateReview()

  const voteReview = useVoteReview()

  const addReply = useAddReply()

  const castPollVote = useCastPollVote()

  const toggleFavorite = useToggleFavorite()

  const toggleFollow = useToggleFollow()

  const addScreening = useAddScreening()

  const deleteScreening = useDeleteScreening()

  const addPoll = useAddPoll()

  const togglePoll = useTogglePoll()

  const deletePoll = useDeletePoll()

  const deleteReview = useDeleteReview()

  const addMovie = useAddMovie()

  const deleteMovie = useDeleteMovie()

  const restoreMovie = useRestoreMovie()

  const deleteComment = useDeleteComment()

  const announcements = useAnnouncements()

  const addAnnouncement = useAddAnnouncement()

  const deleteAnnouncement = useDeleteAnnouncement()

  const setMemberRole = useSetMemberRole()

  const setReviewFeatured = useSetReviewFeatured()

  const updateUsername = useUpdateUsername()

  const setPageSafe = useCallback((p: Page) => setPage(p), [])

  const moviesData = movies.data ?? []

  const deletedMoviesData = deletedMovies.data ?? []

  const reviewsData = reviews.data ?? []

  const threadsData = threads.data ?? {}

  const pollsData = polls.data ?? []

  const screeningsData = screenings.data ?? []

  const leaderboardData = leaderboard.data ?? []

  const membersData = members.data ?? []

  const vaultData = vault.data ?? {
    watched: [],
    plantowatch: [],
    favorites: [],
  }

  const followingData = following.data ?? []

  const userVotesData = userVotes.data ?? {}

  const pollVotesData = pollVotes.data ?? {}

  const announcementsData = announcements.data ?? []

  const onVote = (id: string, dir: "up" | "down") => {
    voteReview.mutate({ id, dir })

    push(dir === "up" ? "Upvoted review" : "Downvoted review")
  }

  const onReply = (reviewId: string, body: string) => {
    addReply.mutate({ reviewId, body }, {
      onSuccess: () => push("Reply posted!"),
    })
  }

  const onWriteReview = (movieId: string, rating: number, body: string) => {
    createReview.mutate({ movie_id: movieId, rating, body }, {
      onSuccess: () => push("Review published!"),

      onError: () => push("Couldn't publish review", "info"),
    })
  }

  const onPollVote = (pollId: string, idx: number) => {
    castPollVote.mutate({ pollId, optionIndex: idx }, {
      onSuccess: () => push("Vote cast!"),
    })
  }

  const onToggleFavorite = (movieId: string) => {
    toggleFavorite.mutate(movieId, {
      onSuccess: () => push("Updated Cinema Vault"),
    })
  }

  const onToggleFollow = (memberId: string, username: string) => {
    toggleFollow.mutate(memberId, {
      onSuccess: () => push(`Updated ${username}`),
    })
  }

  const onAddScreening = (s: Omit<Screening, "id">) => {
    addScreening.mutate(s, { onSuccess: () => push("Screening added") })
  }

  const onDeleteScreening = (id: string) => {
    deleteScreening.mutate(id, { onSuccess: () => push("Screening removed") })
  }

  const onAddPoll = (question: string, closes: string, options: string[]) => {
    addPoll.mutate({ question, closes, options }, {
      onSuccess: () => push("Poll created"),
    })
  }

  const onTogglePoll = (id: string) => {
    togglePoll.mutate(id)
  }

  const onDeletePoll = (id: string) => {
    deletePoll.mutate(id, { onSuccess: () => push("Poll deleted") })
  }

  const onDeleteReview = (id: string) => {
    deleteReview.mutate(id, { onSuccess: () => push("Review removed") })
  }

  const onAddMovie = (m: {
    title: string
    year: number
    genre: string
    rating: number
    director: string
    poster: string
  }) => {
    addMovie.mutate(m, { onSuccess: () => push("Movie added") })
  }

  const onDeleteMovie = (id: string) => {
    deleteMovie.mutate(id, { onSuccess: () => push("Movie moved to deleted") })
  }

  const onRestoreMovie = (id: string) => {
    restoreMovie.mutate(id, { onSuccess: () => push("Movie added back") })
  }

  const onDeleteComment = (id: string) => {
    deleteComment.mutate(id, { onSuccess: () => push("Comment deleted") })
  }

  const onUploadAvatar = async (file: File) => {
    try {
      const url = await uploadAvatar(file)

      if (session) setSession({ user: { ...session.user, avatar_url: url } })

      await updateAvatar(url)

      push("Profile photo updated")
    } catch {
      push("Upload failed", "info")
    }
  }

  const onUploadPoster = async (file: File) => {
    try {
      const url = await uploadPoster(file)

      push("Poster uploaded")

      return url
    } catch (e) {
      push("Upload failed", "info")

      throw e
    }
  }

  const onAddAnnouncement = (a: { title: string body: string }) => {
    addAnnouncement.mutate(a, { onSuccess: () => push("Announcement posted") })
  }

  const onDeleteAnnouncement = (id: string) => {
    deleteAnnouncement.mutate(id, {
      onSuccess: () => push("Announcement removed"),
    })
  }

  const onSetMemberRole = (userId: string, role: "member" | "admin") => {
    setMemberRole.mutate({ userId, role }, {
      onSuccess: () => push("Role updated"),
    })
  }

  const unlockAdmin = () => {
    setAdminUnlocked(true)

    if (session) {
      setMemberRole.mutate({ userId: session.user.id, role: "admin" }, {
        onSuccess: () => push("Admin unlocked"),
      })
    }
  }

  const onSetReviewFeatured = (id: string, featured: boolean, backgroundUrl?: string) => {
    setReviewFeatured.mutate({ reviewId: id, featured, backgroundUrl }, {
      onSuccess: () => push(featured ? "Review featured" : "Review unfeatured"),
    })
  }

  const onUpdateUsername = (username: string) => {
    updateUsername.mutate(username, {
      onSuccess: () => {
        if (session) setSession({ user: { ...session.user, username } })

        push("Profile updated")
      },
    })
  }

  return (
    <div
      className={`${
        dark ? "" : "light"
      } min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300`}
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} />}
      <Toast toasts={toasts} />

      <NavBar
        page={page}
        setPage={setPageSafe}
        dark={dark}
        setDark={setDark}
        session={session}
        onSignIn={() => setShowSignIn(true)}
        onSignOut={() => auth.signOut()}
      />

      <main>
        {page === "home" && (
          <HomePage
            movies={moviesData}
            reviews={reviewsData}
            threads={threadsData}
            userVotes={userVotesData}
            onVote={onVote}
            onReply={onReply}
            polls={pollsData}
            pollVotes={pollVotesData}
            onPollVote={onPollVote}
            favorites={vaultData.favorites}
            onToggleFavorite={onToggleFavorite}
            onWriteReview={onWriteReview}
            announcements={announcementsData}
          />
        )}
        {page === "calendar" && (
          <CalendarPage screenings={screeningsData} push={push} />
        )}
        {page === "leaderboard" && (
          <LeaderboardPage leaderboard={leaderboardData} />
        )}
        {page === "profile" && (
          <ProfilePage
            movies={moviesData}
            reviews={reviewsData}
            vault={vaultData}
            members={membersData}
            following={followingData}
            onToggleFollow={onToggleFollow}
            session={session}
            onUploadAvatar={onUploadAvatar}
            onUpdateUsername={onUpdateUsername}
          />
        )}
        {page === "admin" &&
          (adminUnlocked && session ? (
            <AdminPage
              screenings={screeningsData}
              onAddScreening={onAddScreening}
              onDeleteScreening={onDeleteScreening}
              polls={pollsData}
              onAddPoll={onAddPoll}
              onTogglePoll={onTogglePoll}
              onDeletePoll={onDeletePoll}
              reviews={reviewsData}
              movies={moviesData}
              deletedMovies={deletedMoviesData}
              threads={threadsData}
              onDeleteReview={onDeleteReview}
              onAddMovie={onAddMovie}
              onDeleteMovie={onDeleteMovie}
              onRestoreMovie={onRestoreMovie}
              onDeleteComment={onDeleteComment}
              onUploadPoster={onUploadPoster}
              announcements={announcementsData}
              members={membersData}
              onAddAnnouncement={onAddAnnouncement}
              onDeleteAnnouncement={onDeleteAnnouncement}
              onSetMemberRole={onSetMemberRole}
              onSetReviewFeatured={onSetReviewFeatured}
              session={session}
            />
          ) : (
            <AdminGate
              session={session}
              onUnlock={unlockAdmin}
              onSignIn={() => setShowSignIn(true)}
            />
          ))}
      </main>

      <Footer setPage={setPageSafe} />
    </div>
  )
}
