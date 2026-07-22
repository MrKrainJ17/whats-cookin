// Color-mode (light / dark) preference. Stored in localStorage under
// `colorMode` and applied by toggling `data-theme="dark"` on <html>. Because
// every color in the app flows through CSS variables (see index.css), flipping
// that attribute repaints the whole UI instantly. Default is light.
//
// When the user is signed in we also mirror the choice into their Supabase
// user metadata (best-effort — failures are silently ignored so the local
// preference always wins and the app never breaks if Supabase is offline).

import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const KEY = "colorMode";

const listeners = new Set();

export function getColorMode() {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// Apply the mode to the document root. Safe to call before React mounts.
export function applyColorMode(mode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
  } else {
    root.removeAttribute("data-theme");
  }
}

export function setColorMode(mode) {
  const next = mode === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* storage disabled — still apply for this session */
  }
  applyColorMode(next);
  listeners.forEach((fn) => fn(next));

  // Mirror to the signed-in user's profile (best-effort, non-blocking).
  if (isSupabaseConfigured && supabase) {
    supabase.auth
      .updateUser({ data: { colorMode: next } })
      .catch(() => {});
  }
  return next;
}

// Subscribe to mode changes (so multiple toggles stay in sync). Returns an
// unsubscribe function.
export function subscribeColorMode(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Read once at startup and apply — called from main.jsx before render to avoid
// a light-mode flash.
export function initColorMode() {
  applyColorMode(getColorMode());
}
