import { useSyncExternalStore } from "react";
import type { Session } from "./types";

// Tiny reactive session store shared by the auth flow and the UI.
let session: Session | null = null;
const listeners = new Set<() => void>();

export function getSession(): Session | null {
  return session;
}

export function setSession(s: Session | null) {
  session = s;
  listeners.forEach((l) => l());
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession);
}
