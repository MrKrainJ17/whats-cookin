import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { signUp } from "../lib/auth.js";

// Two-state sign-up page:
//   form  — email + password, submits to Supabase
//   sent  — "Check your email" with the confirmation link copy
export default function SignUp() {
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("form"); // form | submitting | sent
  const [error, setError] = useState(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Local validation summary, used both for the Create-account disabled
  // state and for the inline hint under the name field.
  const trimmedName = fullName.trim();
  const nameLooksFull =
    trimmedName.length >= 2 && /\s/.test(trimmedName);
  const nameHint =
    trimmedName.length === 0
      ? null
      : trimmedName.length < 2
        ? "too short — what's your full name?"
        : !/\s/.test(trimmedName)
          ? "please include your full name (first + last)"
          : null;
  const emailLooksValid = /\S+@\S+\.\S+/.test(email.trim());
  const passwordLooksValid = password.length >= 6;
  const canSubmit = nameLooksFull && emailLooksValid && passwordLooksValid;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!nameLooksFull) {
        setError("Please include your full name (first + last).");
      } else if (!emailLooksValid) {
        setError("That email looks off — double-check it.");
      } else {
        setError("Password must be at least 6 characters.");
      }
      return;
    }
    setError(null);
    setState("submitting");
    let data, err;
    try {
      ({ data, error: err } = await signUp(email.trim(), password, trimmedName));
    } catch (thrown) {
      console.error("Signup threw (network/other):", thrown);
      setError("Couldn't sign up — check your connection and try again.");
      setState("form");
      return;
    }
    // Detailed logging so the exact Supabase response is visible in the
    // browser console — lets us tell if ALL auth is broken or just reset.
    console.log("Signup response:", { data, error: err });
    if (err) {
      console.error("Signup error details:", err.message, err.status);
      setError(`Error: ${err.message}`);
      setState("form");
      return;
    }
    // Supabase returns a session immediately when "Confirm email" is
    // disabled in the project, otherwise a confirmation email is sent.
    if (data?.session) {
      navigate("/", { replace: true });
      return;
    }
    setState("sent");
  };

  if (state === "sent") {
    return <CheckYourEmail email={email} onChangeEmail={() => setState("form")} />;
  }

  return (
    <AuthShell back="/welcome" backLabel="Back">
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink leading-[0.95] tracking-tight text-[40px] sm:text-[44px]">
          Sign up
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          save what you cook, sync across devices
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <AuthInput
          ref={nameRef}
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck="false"
        />
        {nameHint && (
          <p className="font-script text-base text-mocha/85 -mt-2 leading-snug">
            {nameHint}
          </p>
        )}
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="off"
          spellCheck="false"
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 6 characters"
          autoComplete="new-password"
          hint="6+ characters; mix of letters and numbers is good"
          error={error}
        />

        <button
          type="submit"
          disabled={state === "submitting" || !canSubmit}
          className="brut-button justify-center mt-2"
          style={{
            background: "var(--color-terracotta)",
            color: "var(--color-paper-warm)",
          }}
        >
          <span className="font-serif text-xl font-bold">
            {state === "submitting" ? "Creating…" : "Create account"}
          </span>
        </button>
      </form>

      <p className="font-script text-base text-mocha mt-6 text-center leading-snug">
        already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-script font-bold text-terracotta underline underline-offset-2"
        >
          log in
        </button>
      </p>
    </AuthShell>
  );
}

function CheckYourEmail({ email, onChangeEmail }) {
  const [cooldown, setCooldown] = useState(60);
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    if (cooldown > 0) return;
    // Same signUp call re-issues a confirmation email.
    setCooldown(60);
    await signUp(email, "");
  };

  return (
    <AuthShell hideBack>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4 -mt-6">
        <EnvelopeIllustration />
        <h1 className="font-serif font-extrabold text-ink leading-[0.95] tracking-tight text-[44px] sm:text-[52px]">
          Almost there!
        </h1>
        <p className="font-script text-xl text-mocha leading-snug max-w-xs">
          we sent a confirmation link to <strong>{email}</strong>
        </p>
        <p className="font-script text-base text-mocha/85 leading-snug max-w-xs">
          tap the link in your email to verify your account, then come back here
        </p>

        <p className="font-script text-sm text-mocha/70 leading-snug max-w-xs">
          don't see it? check your spam folder 👀
        </p>

        <div className="flex flex-col items-center gap-2 mt-4">
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-serif font-bold text-ink underline underline-offset-2 disabled:no-underline disabled:text-mocha disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't get the email? Resend"}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            className="font-script text-base text-mocha hover:text-ink"
          >
            Wrong email? Change it
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

function EnvelopeIllustration() {
  return (
    <svg
      viewBox="0 0 96 72"
      className="w-28 h-20 text-ink"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="10"
        width="84"
        height="56"
        rx="3"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="#fcf6e8"
      />
      <path
        d="M6 14 L 48 42 L 90 14"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx="74" cy="56" r="6" fill="#c4521a" />
      <path
        d="M 70 56 L 73 59 L 78 53"
        stroke="#fcf6e8"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
