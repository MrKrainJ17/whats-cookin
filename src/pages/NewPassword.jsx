import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import { updatePassword } from "../lib/auth.js";
import { useSession } from "../lib/sessionContext.js";

// NEW PASSWORD page (route: /auth/reset-callback). The user lands here from the
// reset-link email. Supabase's detectSessionInUrl consumes the URL hash and
// establishes a recovery session, so we just collect + save a new password.

// Rough password strength: score by length + character variety.
function scorePassword(pw) {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak" };
  if (score <= 3) return { level: 2, label: "Medium" };
  return { level: 3, label: "Strong" };
}

const STRENGTH_COLORS = ["#d1c7b7", "#d2691e", "#c9a227", "#87a16f"];

export default function NewPassword() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const passwordRef = useRef(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [state, setState] = useState("form"); // form | submitting | done

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const strength = scorePassword(password);
  const longEnough = password.length >= 8;
  const matches = password === confirm && confirm.length > 0;
  const canSubmit = longEnough && matches && state !== "submitting";

  const submit = async (e) => {
    e.preventDefault();
    if (!longEnough) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!matches) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setState("submitting");
    try {
      const { error: err } = await updatePassword(password);
      if (err) {
        setError(err.message);
        setState("form");
        return;
      }
      setState("done");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setState("form");
    }
  };

  // No recovery session (opened directly or the link expired) — bounce to reset.
  if (!loading && !session) {
    return (
      <AuthShell back="/login">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <span className="text-5xl" aria-hidden="true">
            ⏱️
          </span>
          <h1 className="font-serif font-extrabold text-ink text-[32px] leading-tight">
            Link expired
          </h1>
          <p className="font-script text-lg text-mocha leading-snug max-w-xs">
            request a fresh reset link
          </p>
          <button
            type="button"
            onClick={() => navigate("/reset-password", { replace: true })}
            className="brut-button justify-center mt-4"
          >
            <span className="font-serif text-lg font-bold">
              Request new link
            </span>
          </button>
        </div>
      </AuthShell>
    );
  }

  if (state === "done") {
    return (
      <AuthShell hideBack>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4 -mt-6">
          <span className="text-6xl" aria-hidden="true">
            🎉
          </span>
          <h1 className="font-serif font-extrabold text-ink text-[40px] leading-tight">
            Password updated!
          </h1>
          <p className="font-script text-lg text-mocha leading-snug">
            you're all set
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="brut-button justify-center mt-4"
            style={{
              background: "var(--color-terracotta)",
              color: "var(--color-paper-warm)",
            }}
          >
            <span className="font-serif text-lg font-bold">Go to login</span>
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell hideBack>
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink text-[40px] sm:text-[44px] leading-tight">
          Choose a new password
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          make it a good one
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <PasswordField
          ref={passwordRef}
          label="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 8 characters"
          show={showPw}
          onToggle={() => setShowPw((v) => !v)}
        />

        {password.length > 0 && (
          <div className="-mt-2">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{
                    background:
                      i <= strength.level
                        ? STRENGTH_COLORS[strength.level]
                        : "var(--color-ink)",
                    opacity: i <= strength.level ? 1 : 0.12,
                  }}
                />
              ))}
            </div>
            <span
              className="block font-script text-base mt-1 leading-none"
              style={{ color: STRENGTH_COLORS[strength.level] }}
            >
              {strength.label}
            </span>
          </div>
        )}

        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="type it again"
          show={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          error={error}
        />

        <button
          type="submit"
          disabled={!canSubmit}
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

// Password input with a show/hide eye toggle. Matches the app's ink-input.
function PasswordField({
  ref,
  label,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
  error,
}) {
  return (
    <label className="block">
      <span className="block font-serif font-semibold text-[15px] text-ink mb-1.5">
        {label}
      </span>
      <div className="relative">
        <input
          ref={ref}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`ink-input pr-12 ${error ? "border-terracotta" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-mocha hover:text-ink"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <span className="block font-body text-xs text-terracotta mt-1">
          {error}
        </span>
      )}
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-2.16 2.94M6.06 6.06A13.2 13.2 0 0 0 2 11s3.5 7 10 7a9.1 9.1 0 0 0 3.94-.94" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M2 2l20 20" />
    </svg>
  );
}
