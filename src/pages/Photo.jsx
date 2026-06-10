import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import WhiskLoader from "../components/handDrawn/WhiskLoader.jsx";
import HandBack from "../components/handDrawn/HandBack.jsx";
import { identifyIngredients } from "../lib/claude.js";
import { generateRecipes } from "../lib/generateRecipes.js";

const STATUS_MESSAGES = {
  empty: "we couldn't spot any ingredients — try a clearer photo, or type them in instead",
  blurry: "that photo's a little fuzzy — give it more light or a steadier hand",
  non_food: "that doesn't look like food! try the fridge or pantry instead",
};

const STATUS_EMOJI = {
  empty: "🤔",
  blurry: "📷",
  non_food: "🤨",
};

export default function Photo() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [shots, setShots] = useState([]);
  const [status, setStatus] = useState("idle");
  const [progressLabel, setProgressLabel] = useState("Looking at your photo…");
  const [error, setError] = useState(null);
  const [nonOk, setNonOk] = useState(null);

  useEffect(() => {
    return () => {
      shots.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const next = Array.from(fileList).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setShots((prev) => [...prev, ...next]);
  };

  const removeShot = (idx) => {
    setShots((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const analyze = async () => {
    if (shots.length === 0) return;
    setStatus("loading");
    setError(null);
    setNonOk(null);
    setProgressLabel("Looking at your photo…");
    try {
      const result = await identifyIngredients(
        shots.map((s) => s.file),
        { onProgress: setProgressLabel },
      );

      if (result.status !== "ok" || result.ingredients.length === 0) {
        const kind =
          result.status !== "ok" && result.status in STATUS_MESSAGES
            ? result.status
            : "empty";
        setNonOk({ kind, note: result.note });
        setStatus("non_ok");
        return;
      }

      const allHigh = result.ingredients.every(
        (i) => i.confidence === "high",
      );
      if (allHigh) {
        const ingredientNames = result.ingredients.map((i) => i.name);
        generateRecipes(ingredientNames).catch(() => {});
        navigate("/recipes", {
          state: {
            ingredients: ingredientNames,
            richIngredients: result.ingredients,
            autoConfirmed: true,
          },
        });
        return;
      }

      navigate("/confirm", { state: { ingredients: result.ingredients } });
    } catch (err) {
      console.error(err);
      setError(err.message ?? String(err));
      setStatus("error");
    }
  };

  const reset = () => {
    shots.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    setShots([]);
    setStatus("idle");
    setError(null);
    setNonOk(null);
  };

  // Loading state takes over the viewport.
  if (status === "loading") {
    return (
      <>
        <PaperBackdrop />
        <div className="viewport-center relative z-10">
          <div className="absolute top-6 left-5">
            <HandBack onClick={() => navigate("/")} />
          </div>
          <div className="flex flex-col items-center gap-6 w-full max-w-md px-5">
            {shots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 w-full">
                {shots.map((s, i) => (
                  <img
                    key={s.previewUrl}
                    src={s.previewUrl}
                    alt={`Photo ${i + 1}`}
                    className="aspect-square w-full object-cover rounded-xl border-2 border-ink shadow-[3px_3px_0_0_var(--color-ink)]"
                  />
                ))}
              </div>
            )}
            <WhiskLoader size={72} />
            <p className="font-serif text-2xl font-bold text-ink leading-snug text-center">
              {progressLabel}
            </p>
            <p className="font-script text-lg text-mocha leading-none">
              give us a sec…
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PaperBackdrop />

      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <HandBack onClick={() => navigate("/")} className="self-start mb-3" />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* IDLE — no shots yet */}
          {status === "idle" && shots.length === 0 && (
            <div className="flex-1 flex flex-col items-center">
              <header className="text-center w-full">
                <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
                  Snap your{" "}
                  <span className="italic font-bold text-terracotta">
                    fridge
                  </span>
                </h2>
                <p className="font-script text-lg text-mocha mt-2 leading-none">
                  open the door, get everything in frame
                </p>
              </header>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-10 w-full max-w-sm aspect-[4/3] bg-paper-warm border-[3px] border-dashed border-ink rounded-2xl shadow-[5px_5px_0_0_var(--color-ink)] flex flex-col items-center justify-center gap-3 px-6 py-8 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform"
              >
                <span
                  className="text-7xl inline-block"
                  style={{ transform: "rotate(-6deg)" }}
                  aria-hidden="true"
                >
                  📸
                </span>
                <span className="font-serif font-extrabold text-xl text-ink">
                  Tap to take a photo
                </span>
                <span className="font-body text-sm text-mocha">
                  or upload from your library
                </span>
              </button>
            </div>
          )}

          {/* IDLE — shots already captured */}
          {status === "idle" && shots.length > 0 && (
            <div className="flex-1 flex flex-col gap-4">
              <header>
                <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-ink leading-[0.95] tracking-tight">
                  {shots.length === 1
                    ? "Got it. One more?"
                    : `${shots.length} photos. One more?`}
                </h2>
                <p className="font-script text-lg text-mocha mt-2 leading-none">
                  fridge + pantry + spice rack all count
                </p>
              </header>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {shots.map((s, i) => (
                  <div
                    key={s.previewUrl}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-ink bg-paper-warm shadow-[3px_3px_0_0_var(--color-ink)]"
                  >
                    <img
                      src={s.previewUrl}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeShot(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-ink/85 text-paper-warm text-sm font-bold leading-none flex items-center justify-center"
                    >
                      <svg viewBox="0 0 12 12" className="w-3 h-3">
                        <path d="M3 3 L 9 9 M 9 3 L 3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="self-center mt-2 font-script text-base text-terracotta hover:text-ink inline-flex items-center gap-1.5"
              >
                <span className="text-lg leading-none">＋</span>
                <span>add another photo</span>
              </button>

              <div className="flex-1" />

              <button
                type="button"
                onClick={analyze}
                className="brut-button mt-6 justify-center"
              >
                <span className="font-serif text-xl font-bold">
                  Analyze {shots.length} photo{shots.length === 1 ? "" : "s"}
                </span>
                <HandArrow />
              </button>
            </div>
          )}

          {/* NON-OK from model */}
          {status === "non_ok" && nonOk && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-4">
              <div
                className="text-7xl inline-block"
                style={{ transform: "rotate(-6deg)" }}
                aria-hidden="true"
              >
                {STATUS_EMOJI[nonOk.kind] ?? "🤔"}
              </div>
              <p className="font-script text-2xl text-mocha leading-snug max-w-xs">
                {STATUS_MESSAGES[nonOk.kind]}
              </p>
              {nonOk.note && (
                <p className="font-body text-xs text-mocha/60 italic">
                  {nonOk.note}
                </p>
              )}
              <div className="flex flex-col items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="brut-button justify-center"
                >
                  <span className="font-serif text-lg font-bold">
                    Try another photo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="font-script text-base text-mocha hover:text-ink underline underline-offset-2"
                >
                  or head home
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
              <div
                className="text-7xl inline-block"
                style={{ transform: "rotate(4deg)" }}
                aria-hidden="true"
              >
                😬
              </div>
              <p className="font-serif text-xl font-bold text-ink leading-snug">
                Something went sideways.
              </p>
              {error && (
                <p className="font-body text-sm text-mocha max-w-xs">{error}</p>
              )}
              <button
                type="button"
                onClick={reset}
                className="brut-button justify-center"
              >
                <span className="font-serif text-lg font-bold">Try again</span>
              </button>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 30 14" className="w-8 h-4 ml-1" aria-hidden="true">
      <path
        d="M1 7 Q 13 5, 25 7"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M20 2 L 28 7 L 20 12"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
