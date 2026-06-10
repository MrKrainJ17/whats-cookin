// Lazy Supabase client. The URL + anon key live in env vars so this
// repo can be committed without secrets. When either is missing, the
// client is `null` and the auth functions return a friendly error
// instead of throwing — that way the auth pages still render before
// the user has set up their Supabase project.
//
// To wire this up:
//   1. Create a project at https://supabase.com
//   2. Copy the project URL + anon key
//   3. Drop them in `.env.local`:
//        VITE_SUPABASE_URL=https://xxx.supabase.co
//        VITE_SUPABASE_ANON_KEY=eyJ...
//   4. Restart `npm run dev`

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        // Implicit flow over PKCE: PKCE stores a code-verifier in
        // localStorage at signup time that has to be present in the
        // same browser when the email link is clicked. That fails the
        // moment storage clears, the user switches browsers, or the
        // link opens in an in-app browser. Implicit flow drops tokens
        // straight into the URL hash — works regardless of session
        // continuity. Trade-off: tokens sit briefly in browser history
        // (acceptable for a client-side React app).
        flowType: "implicit",
        // Persist the session in localStorage so a reload keeps the
        // user signed in. Supabase handles refresh tokens behind the
        // scenes; we don't manage timing ourselves.
        persistSession: true,
        autoRefreshToken: true,
        // Auto-consume access_token / refresh_token from the URL hash
        // when the page loads — AuthCallback just polls getSession().
        detectSessionInUrl: true,
      },
    })
  : null;

// Friendly error for the auth pages to render when nothing's been
// configured yet. Lets the user reach the form and see what's missing.
export const NOT_CONFIGURED_ERROR =
  "Sign-in isn't connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local and restart the dev server.";
