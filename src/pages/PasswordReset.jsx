import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { updatePassword } from "../lib/auth.js";
import { useSession } from "../lib/sessionContext.js";

// User lands here from the "reset password" email link. Supabase has
// already set a recovery session (via detectSessionInUrl). We just
// collect a new password and call updateUser.
export default function PasswordReset() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const passwordRef = useRef(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [state, setState] = useState("form"); // form | submitting | done

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setState("submitting");
    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err.message);
      setState("form");
      return;
    }
    setState("done");
    window.setTimeout(() => navigate("/", { replace: true }), 1100);
  };

  // No active session and we're not loading? Either the user opened
  // this URL directly or the recovery link expired. Send them to login.
  if (!loading && !session) {
    return (
      <AuthShell back="/welcome">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <span className="text-5xl" aria-hidden="true">⏱️</span>
          <h1 className="font-serif font-extrabold text-ink text-[32px] leading-tight">
            Link expired
          </h1>
          <p className="font-script text-lg text-mocha leading-snug max-w-xs">
            request a fresh reset link from the log in page
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="brut-button justify-center mt-4"
          >
            <span className="font-serif text-lg font-bold">Back to log in</span>
          </button>
        </div>
      </AuthShell>
    );
  }

  if (state === "done") {
    return (
      <AuthShell hideBack>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <span className="text-5xl" aria-hidden="true">✓</span>
          <h1 className="font-serif font-extrabold text-ink text-[36px] leading-tight">
            Password updated
          </h1>
          <p className="font-script text-lg text-mocha leading-snug">
            you're all set — heading home
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell hideBack>
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink text-[40px] sm:text-[44px] leading-tight">
          Set a new password
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          something you can remember next time
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <AuthInput
          ref={passwordRef}
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 6 characters"
          autoComplete="new-password"
        />
        <AuthInput
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="type it again"
          autoComplete="new-password"
          error={error}
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="brut-button justify-center mt-2"
          style={{
            background: "var(--color-terracotta)",
            color: "var(--color-paper-warm)",
          }}
        >
          <span className="font-serif text-xl font-bold">
            {state === "submitting" ? "Saving…" : "Save new password"}
          </span>
        </button>
      </form>
    </AuthShell>
  );
}
