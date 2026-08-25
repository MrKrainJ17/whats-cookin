import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { resetPassword } from "../lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password-reset REQUEST page (route: /reset-password). Collects the user's
// email and sends a Supabase reset link that redirects to /auth/reset-callback,
// where NewPassword collects the actual new password.
export default function ResetPassword() {
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [state, setState] = useState("form"); // form | submitting | sent

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setState("submitting");
    const { error: err } = await resetPassword(email.trim());
    if (err) {
      setError(err.message);
      setState("form");
      return;
    }
    setState("sent");
  };

  if (state === "sent") {
    return (
      <AuthShell hideBack>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4 -mt-6">
          <span className="text-5xl" aria-hidden="true">
            📬
          </span>
          <h1 className="font-serif font-extrabold text-ink text-[36px] leading-tight">
            Check your email!
          </h1>
          <p className="font-body text-base text-mocha leading-snug max-w-xs">
            We sent a reset link to{" "}
            <span className="font-semibold text-ink break-all">
              {email.trim()}
            </span>
            . Click it to set a new password.
          </p>
          <p className="font-script text-lg text-mocha/80 leading-none">
            check your spam folder 👀
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="brut-button justify-center mt-4"
          >
            <span className="font-serif text-lg font-bold">Back to login</span>
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell back="/login" backLabel="Back to login">
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink text-[40px] sm:text-[44px] leading-tight">
          Reset your password
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          we'll send you a reset link
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <AuthInput
          ref={emailRef}
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck="false"
          error={error}
        />
        <button
          type="submit"
          disabled={!valid || state === "submitting"}
          className="brut-button justify-center mt-2"
          style={{
            background: "var(--color-terracotta)",
            color: "var(--color-paper-warm)",
          }}
        >
          <span className="font-serif text-xl font-bold">
            {state === "submitting" ? "Sending…" : "Send reset link"}
          </span>
        </button>
      </form>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-body text-sm text-mocha hover:text-ink"
        >
          ← Back to login
        </button>
      </div>

      <p className="font-script text-base text-mocha/70 mt-6 text-center leading-snug">
        we only use your email to reset your password
      </p>
    </AuthShell>
  );
}
