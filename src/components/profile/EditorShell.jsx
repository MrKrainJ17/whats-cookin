import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../PageShell.jsx";
import PaperBackdrop from "../handDrawn/PaperBackdrop.jsx";

// Shared layout for every preference editor. Owns:
//   • back / cancel link
//   • headline + handwritten subtitle
//   • bottom Save button with success flash + auto-navigate-back
//
// The editor body (chips, cards, slider) is rendered by the caller.
export default function EditorShell({
  title,
  subtitle,
  saveDisabled = false,
  onSave,
  children,
}) {
  const navigate = useNavigate();
  const [state, setState] = useState("editing"); // editing | saving | saved

  // After "Saved!" flashes, route home to Profile.
  useEffect(() => {
    if (state !== "saved") return undefined;
    const t = window.setTimeout(() => navigate("/profile"), 850);
    return () => window.clearTimeout(t);
  }, [state, navigate]);

  const handleSave = async () => {
    if (saveDisabled) return;
    setState("saving");
    try {
      await onSave();
      setState("saved");
    } catch (err) {
      console.error("[EditorShell] save failed:", err);
      setState("editing");
    }
  };

  return (
    <>
      <PaperBackdrop />
      <PageShell>
        <div className="relative z-10 flex flex-col flex-1 survey-slide-forward">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
          >
            ← Back
          </button>

          <header className="mb-5">
            <h1 className="font-serif font-extrabold text-ink text-[32px] sm:text-4xl leading-[1.05] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="font-script text-lg text-mocha mt-1.5 leading-snug">
                {subtitle}
              </p>
            )}
          </header>

          <div className="flex-1">{children}</div>

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="font-script text-base text-mocha hover:text-ink"
            >
              Cancel
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled || state !== "editing"}
              className="brut-button !w-auto !py-3 !px-6 justify-center"
              style={{
                background: "var(--color-terracotta)",
                color: "var(--color-paper-warm)",
              }}
            >
              <span className="font-serif text-lg font-bold">
                {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </PageShell>

      {state === "saved" && <SavedFlash />}
    </>
  );
}

function SavedFlash() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fadeIn"
    >
      <div className="brut-card px-6 py-5 flex items-center gap-3 bg-paper-warm">
        <span className="w-8 h-8 rounded-full bg-sage text-paper-warm flex items-center justify-center text-lg font-bold">
          ✓
        </span>
        <span className="font-serif text-xl font-extrabold text-ink leading-none">
          Saved!
        </span>
      </div>
    </div>
  );
}
