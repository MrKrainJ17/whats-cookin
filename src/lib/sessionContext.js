import { createContext, useContext } from "react";

// Shared context + hook. Kept in a non-JSX module so SessionProvider's
// component file can satisfy Vite's React Fast Refresh "only export
// components" rule.

export const SessionContext = createContext({
  session: null,
  loading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

// Derive a one-letter avatar from the user's email or name metadata.
export function getInitial(session) {
  if (!session?.user) return "?";
  const name =
    session.user.user_metadata?.full_name ||
    session.user.user_metadata?.name ||
    session.user.email ||
    "";
  return name.trim().slice(0, 1).toUpperCase() || "?";
}
