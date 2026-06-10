import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditorShell from "../../components/profile/EditorShell.jsx";
import AuthInput from "../../components/auth/AuthInput.jsx";
import { updateFullName } from "../../lib/auth.js";
import { useSession } from "../../lib/sessionContext.js";

export default function EditName() {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const inputRef = useRef(null);
  // Lazy initializer reads the current name from session at first render.
  // Subsequent session changes (rare on this page) won't overwrite the
  // user's in-progress edit — that's the correct behavior.
  const [fullName, setFullName] = useState(
    () => session?.user?.user_metadata?.full_name || "",
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = fullName.trim();
  const looksFull = trimmed.length >= 2 && /\s/.test(trimmed);
  const hint =
    trimmed.length === 0 || looksFull
      ? null
      : trimmed.length < 2
        ? "too short — what's your full name?"
        : "please include your full name (first + last)";

  if (!loading && !session) {
    navigate("/profile", { replace: true });
    return null;
  }

  return (
    <EditorShell
      title="Your name"
      subtitle="how you'd like to be greeted"
      saveDisabled={!looksFull}
      onSave={async () => {
        const { error } = await updateFullName(trimmed);
        if (error) throw error;
      }}
    >
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
        error={hint}
      />
    </EditorShell>
  );
}
