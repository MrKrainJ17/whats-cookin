import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import { exchangeCodeForSession, getSession } from "../lib/auth.js";

// Handles the redirect from a Supabase email link (sign-up confirmation
// or magic link). Supabase's detectSessionInUrl already strips the hash
// for implicit-flow links, but the PKCE flow lands here with a `?code=`
// query param that we need to exchange for a session explicitly.
export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState("verifying"); // verifying | ok | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const code = params.get("code");
      const errorParam = params.get("error_description") || params.get("error");
      if (errorParam) {
        if (!cancelled) {
          setErrorMsg(decodeURIComponent(errorParam));
          setState("error");
        }
        return;
      }

      if (code) {
        const { error } = await exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setErrorMsg(error.message);
          setState("error");
          return;
        }
      }

      // detectSessionInUrl may already have consumed the hash for
      // legacy implicit-flow links — just check whether we ended up
      // with a session either way.
      const { data } = await getSession();
      if (cancelled) return;
      if (data?.session) {
        setState("ok");
        // Brief moment of celebration before bouncing home.
        window.setTimeout(() => navigate("/", { replace: true }), 900);
      } else {
        setErrorMsg("We couldn't verify your email link. It may have expired.");
        setState("error");
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [navigate, params]);

  return (
    <AuthShell hideBack>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4 -mt-6">
        {state === "verifying" && (
          <>
            <span className="text-5xl animate-pulse" aria-hidden="true">
              🔑
            </span>
            <h1 className="font-serif font-extrabold text-ink text-[40px] leading-tight">
              Verifying…
            </h1>
            <p className="font-script text-lg text-mocha leading-snug">
              one moment while we open the door
            </p>
          </>
        )}
        {state === "ok" && (
          <>
            <span className="text-6xl" aria-hidden="true">🍳</span>
            <h1 className="font-serif font-extrabold text-ink text-[44px] leading-tight">
              You're in!
            </h1>
            <p className="font-script text-xl text-mocha leading-snug">
              welcome to What's Cookin
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <span className="text-5xl" aria-hidden="true">⚠️</span>
            <h1 className="font-serif font-extrabold text-ink text-[36px] leading-tight">
              Couldn't verify
            </h1>
            <p className="font-body text-base text-mocha leading-snug max-w-xs">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={() => navigate("/welcome", { replace: true })}
              className="brut-button justify-center mt-4"
            >
              <span className="font-serif text-lg font-bold">Try again</span>
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}
