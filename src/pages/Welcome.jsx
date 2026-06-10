import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import PenStroke from "../components/handDrawn/PenStroke.jsx";
import { isSupabaseConfigured } from "../lib/supabaseClient.js";
import { useSession } from "../lib/sessionContext.js";

// Auth landing page. Two CTAs (Sign Up / Log In) and a third quieter
// option to keep cooking anonymously. Reachable from the home page's
// top-right Sign In link or by visiting /welcome directly.
export default function Welcome() {
  const navigate = useNavigate();
  const { session } = useSession();

  // Already logged in → no point in seeing this page. Bounce to home.
  if (session) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <header className="text-center mt-8">
            <span className="text-5xl inline-block" aria-hidden="true">
              🍳
            </span>
            <h1 className="font-serif font-extrabold text-ink leading-[0.95] tracking-tight mt-3 text-[48px] sm:text-[56px]">
              Welcome
            </h1>
            <p className="font-script text-xl text-mocha mt-3 leading-snug max-w-xs mx-auto">
              save your recipes, sync across devices, never lose a favorite
            </p>
            <PenStroke className="mt-5" width={112} />
          </header>

          {!isSupabaseConfigured && <NotConfiguredNotice />}

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="brut-button justify-center"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-paper-warm)",
              }}
            >
              <span className="font-serif text-xl font-bold">
                Sign up — it's free
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="brut-button justify-center"
            >
              <span className="font-serif text-xl font-bold">Log in</span>
            </button>
          </div>

          <div className="flex-1" />

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="font-script text-lg text-mocha/85 hover:text-ink leading-none"
            >
              keep cooking as a guest →
            </button>
            <p className="font-body text-xs text-mocha/70 mt-3 leading-snug max-w-xs mx-auto">
              guest data stays on this device. sign up later to keep it.
            </p>
          </div>
        </div>
      </PageShell>
    </>
  );
}

function NotConfiguredNotice() {
  return (
    <div className="mt-6 brut-card p-4 border-terracotta">
      <p className="font-serif text-base font-bold text-terracotta leading-tight">
        Sign-in isn't connected yet
      </p>
      <p className="font-body text-sm text-mocha mt-1 leading-snug">
        Add{" "}
        <code className="bg-ink/5 border border-ink/15 rounded px-1 py-0.5 text-xs">
          VITE_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="bg-ink/5 border border-ink/15 rounded px-1 py-0.5 text-xs">
          VITE_SUPABASE_ANON_KEY
        </code>{" "}
        to your <code className="text-xs">.env.local</code> and restart the
        dev server. The pages still load so you can preview the design.
      </p>
    </div>
  );
}
