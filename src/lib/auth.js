// Thin wrapper around the Supabase auth client. Every function returns
// a `{ data, error }` shape so callers can render UI consistently.
// Auth pages should always use these helpers instead of touching
// `supabase.auth` directly — that keeps the not-configured fallback
// in one place.

import { supabase, NOT_CONFIGURED_ERROR } from "./supabaseClient.js";

function unconfigured() {
  return { data: null, error: { message: NOT_CONFIGURED_ERROR } };
}

// Where to redirect Supabase after the user clicks the email link.
// Used by both signUp (confirmation link) and password reset.
function redirectTo(path) {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

export async function signUp(email, password, fullName) {
  if (!supabase) return unconfigured();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      // The confirmation link in the user's email lands here. The
      // AuthCallback page reads the code from the URL, exchanges it
      // for a session, and redirects home.
      emailRedirectTo: redirectTo("/auth/callback"),
      // user_metadata.full_name flows into the public.profiles row via
      // the handle_new_user trigger Supabase fires on every signup.
      data: fullName ? { full_name: fullName.trim() } : undefined,
    },
  });
}

export async function updateFullName(fullName) {
  if (!supabase) return unconfigured();
  const trimmed = String(fullName || "").trim();
  return supabase.auth.updateUser({ data: { full_name: trimmed } });
}

export async function signInWithPassword(email, password) {
  if (!supabase) return unconfigured();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return unconfigured();
  return supabase.auth.signOut();
}

export async function resetPassword(email) {
  if (!supabase) return unconfigured();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo("/reset-password"),
  });
}

export async function updatePassword(newPassword) {
  if (!supabase) return unconfigured();
  return supabase.auth.updateUser({ password: newPassword });
}

export async function getSession() {
  if (!supabase) return { data: { session: null }, error: null };
  return supabase.auth.getSession();
}

// Subscribe to session changes (sign in, sign out, refresh). Returns an
// unsubscribe function. Used by the SessionProvider to stay in sync.
export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

// Handle the PKCE-style magic-link redirect. Supabase's
// detectSessionInUrl auto-consumes the URL hash, but for the
// authorization-code flow the AuthCallback page needs to call this
// explicitly with the `?code=` query param.
export async function exchangeCodeForSession(code) {
  if (!supabase) return unconfigured();
  return supabase.auth.exchangeCodeForSession(code);
}
