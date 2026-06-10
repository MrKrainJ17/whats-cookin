import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { updateFullName } from "../lib/auth.js";
import { useSession } from "../lib/sessionContext.js";
import { clearNameSkipped, markNameSkipped } from "../lib/namePrompt.js";

// One-step "tell us your name" page for existing accounts created
// before the Full Name field was required. Route gate in App.jsx
// sends signed-in users here when their user_metadata.full_name is
// empty. They can skip — a nudge is shown but never blocks them again.

export default function NameRequired() {
  const navigate = useNavigate();
  const { session } = useSession();
  const inputRef = useRef(null);
  const [fullName, setFullName] = useState("");
  const [state, setState] = useState("form"); // form | saving | done
  const [error, setError] = useState(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // If we end up here without a session (race), bounce home.
  useEffect(() => {
    if (session === null) {
      navigate("/", { replace: true });
    }
  }, [session, navigate]);

  const trimmed = fullName.trim();
  const looksFull = trimmed.length >= 2 && /\s/.test(trimmed);

  const submit = async (e) => {
    e.preventDefault();
    if (!looksFull) {
      setError("Please include your full name (first + last).");
      return;
    }
    setError(null);
    setState("saving");
    const { error: err } = await updateFullName(trimmed);
    if (err) {
      setError(err.message);
      setState("form");
      return;
    }
    // Clear any skip flag — they've answered.
    clearNameSkipped();
    setState("done");
    window.setTimeout(() => navigate("/", { replace: true }), 700);
  };

  const skip = () => {
    markNameSkipped();
    navigate("/", { replace: true });
  };

  return (
    <AuthShell hideBack>
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink text-[40px] sm:text-[44px] leading-tight">
          Welcome back!
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          we just need your name real quick
        </p>
      </header>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <AuthInput
          ref={inputRef}
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          autoCapitalize="words"
          spellCheck="false"
          error={error}
          hint="first + last name"
        />
        <button
          type="submit"
          disabled={state !== "form" || !looksFull}
          className="brut-button justify-center mt-2"
          style={{
            background: "var(--color-terracotta)",
            color: "var(--color-paper-warm)",
          }}
        >
          <span className="font-serif text-xl font-bold">
            {state === "saving"
              ? "Saving…"
              : state === "done"
                ? "Saved ✓"
                : "Save"}
          </span>
        </button>
      </form>

      <p className="mt-6 text-center font-script text-base text-mocha/80 leading-snug">
        only takes 5 seconds —{" "}
        <button
          type="button"
          onClick={skip}
          className="font-script font-bold text-mocha/85 hover:text-ink underline underline-offset-2"
        >
          skip for now
        </button>
      </p>
    </AuthShell>
  );
}

