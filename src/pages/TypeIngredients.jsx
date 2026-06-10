import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import IngredientChip from "../components/IngredientChip.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import HandBack from "../components/handDrawn/HandBack.jsx";
import { generateRecipes } from "../lib/generateRecipes.js";
import SuggestionRow from "../components/ingredients/SuggestionRow.jsx";

export default function TypeIngredients() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = (raw) => {
    const value = String(raw || "").trim().toLowerCase();
    if (!value) return;
    setItems((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setDraft("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && items.length > 0) {
      setItems((prev) => prev.slice(0, -1));
    }
  };

  const remove = (name) => {
    setItems((prev) => prev.filter((x) => x !== name));
  };

  const submit = () => {
    let final = items;
    const trailing = draft.trim().toLowerCase();
    if (trailing && !items.includes(trailing)) final = [...items, trailing];
    if (final.length === 0) return;
    generateRecipes(final).catch(() => {});
    navigate("/recipes", { state: { ingredients: final } });
  };

  return (
    <>
      <PaperBackdrop />

      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <HandBack onClick={() => navigate("/")} className="self-start mb-3" />

          <header>
            <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
              What do you{" "}
              <span className="italic font-bold text-terracotta">have?</span>
            </h2>
            <p className="font-script text-lg text-mocha mt-2 leading-none">
              list everything in your kitchen
            </p>
          </header>

          <div className="mt-7 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="chicken, rice, broccoli…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              className="ink-input flex-1 font-body"
            />
            <button
              type="button"
              onClick={() => commit(draft)}
              className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-5 shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform"
            >
              Add
            </button>
          </div>

          <SuggestionRow input={draft} onPick={(name) => commit(name)} />

          <p className="font-script text-base text-mocha/85 mt-6 mb-2 leading-none">
            your ingredients
          </p>

          <div className="flex flex-wrap gap-2 min-h-[36px]">
            {items.length === 0 ? (
              <p className="font-script text-base text-mocha/55 italic leading-none">
                nothing yet — add something tasty above
              </p>
            ) : (
              items.map((name) => (
                <IngredientChip
                  key={name}
                  name={name}
                  confidence="high"
                  onRemove={() => remove(name)}
                />
              ))
            )}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            disabled={items.length === 0 && draft.trim() === ""}
            onClick={submit}
            className="brut-button mt-8 justify-center"
          >
            <span className="font-serif text-xl font-bold">
              Show me recipes
            </span>
            <HandArrow />
          </button>
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
