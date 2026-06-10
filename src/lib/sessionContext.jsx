import { useEffect, useState } from "react";
import { getSession, onAuthStateChange } from "./auth.js";
import { SessionContext } from "./sessionContext.js";

// Provider component only — callers that need `useSession` or
// `getInitial` should import them from `./sessionContext.js` directly.
export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
      setLoading(false);
    });
    const unsubscribe = onAuthStateChange((next) => {
      if (!mounted) return;
      setSession(next);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}
