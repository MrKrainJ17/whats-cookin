import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell.jsx";
import AuthInput from "../components/auth/AuthInput.jsx";
import { signInWithPassword } from "../lib/auth.js";

export default function LogIn() {
  const navigate = useNavigate();
  const emailRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("form"); // form | submitting
  const [error, setError] = useState(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError(null);
    setState("submitting");
    const { error: err } = await signInWithPassword(email.trim(), password);
    if (err) {
      setError(err.message);
      setState("form");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthShell back="/welcome" backLabel="Back">
      <header className="mt-4">
        <h1 className="font-serif font-extrabold text-ink leading-[0.95] tracking-tight text-[40px] sm:text-[44px]">
          Welcome back
        </h1>
        <p className="font-script text-lg text-mocha mt-2 leading-snug">
          good to see you in the kitchen again
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
        />
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="your password"
          autoComplete="current-password"
          error={error}
        />

        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={() => navigate("/reset-password")}
            className="font-script text-base text-mocha hover:text-ink underline underline-offset-2"
          >
            Forgot password?
          </button>
        </div>

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
            {state === "submitting" ? "Signing in…" : "Log in"}
          </span>
        </button>
      </form>

      <p className="font-script text-base text-mocha mt-6 text-center leading-snug">
        new here?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="font-script font-bold text-terracotta underline underline-offset-2"
        >
          sign up
        </button>
      </p>
    </AuthShell>
  );
}
