import { useRef, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import PageShell from "../components/PageShell.jsx";
import IngredientChip from "../components/IngredientChip.jsx";
import PaperBackdrop from "../components/handDrawn/PaperBackdrop.jsx";
import { generateRecipes } from "../lib/generateRecipes.js";
import { logEvent } from "../lib/eventTracker.js";
import {
  getHardAvoidList,
  ingredientMatchesAvoid,
} from "../lib/preferences.js";
import { getEmojiForIngredient } from "../lib/ingredientEmojis.js";

export default function Confirm() {
  const navigate = useNavigate();
  const location = useLocation();
  const initial = Array.isArray(location.state?.ingredients)
    ? location.state.ingredients
    : null;

  // Auto-filter detected ingredients against the user's allergy / hard
  // avoid list. We keep a record of what was removed so we can show a
  // dismissible banner letting the user re-add if it was a misfire.
  const filtered = useFilteredInitial(initial);

  const [items, setItems] = useState(() =>
    filtered.kept ? dedupe(filtered.kept.map(normalize)) : [],
  );
  const [draft, setDraft] = useState("");
  const [autoRemoved, setAutoRemoved] = useState(filtered.removed);

  const aiDetectedNamesRef = useRef(
    new Set(
      Array.isArray(initial)
        ? initial.map((x) => normalize(x)?.name).filter(Boolean)
        : [],
    ),
  );

  const readd = (entry) => {
    setItems((prev) =>
      dedupe([
        ...prev,
        {
          name: entry.name,
          quantity: entry.quantity ?? null,
          confidence: "high",
          category: entry.category ?? "other",
        },
      ]),
    );
    setAutoRemoved((prev) => prev.filter((x) => x.name !== entry.name));
  };

  const dismissBanner = () => setAutoRemoved([]);

  if (initial === null) return <Navigate to="/" replace />;

  const addDraft = () => {
    const value = draft.trim().toLowerCase();
    if (!value) return;
    setItems((prev) =>
      dedupe([
        ...prev,
        { name: value, quantity: null, confidence: "high", category: "other" },
      ]),
    );
    logEvent("ingredient_added_manually", { ingredient: value });
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft();
    }
  };

  const remove = (name) => {
    setItems((prev) => prev.filter((x) => x.name !== name));
    if (aiDetectedNamesRef.current.has(name)) {
      logEvent("ingredient_removed", { ingredient: name });
    }
  };

  const promote = (name) => {
    setItems((prev) =>
      prev.map((x) => (x.name === name ? { ...x, confidence: "high" } : x)),
    );
  };

  const reviewItems = items.filter((x) => x.confidence === "low");
  const confirmedItems = items.filter((x) => x.confidence !== "low");

  const submit = () => {
    const ingredientNames = items.map((x) => x.name);
    generateRecipes(ingredientNames).catch(() => {});
    navigate("/recipes", { state: { ingredients: ingredientNames } });
  };

  return (
    <>
      <PaperBackdrop />

      <PageShell>
        <div className="relative z-10 flex flex-col flex-1">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="self-start font-body text-sm text-mocha hover:text-ink mb-3"
          >
            ← Start over
          </button>

          <header>
            <h2 className="font-serif text-4xl sm:text-5xl font-extrabold text-ink leading-[0.95] tracking-tight">
              Looks like you{" "}
              <span className="italic font-bold text-terracotta">have…</span>
            </h2>
            <p className="font-script text-lg text-mocha mt-2 leading-none">
              tap any to remove, or add more below
            </p>
          </header>

          {autoRemoved.length > 0 && (
            <AutoRemovedBanner
              removed={autoRemoved}
              onReadd={readd}
              onDismiss={dismissBanner}
            />
          )}

          {reviewItems.length > 0 && (
            <section className="mt-6 brut-card p-4 border-terracotta">
              <h3 className="font-serif text-lg font-bold text-terracotta uppercase tracking-wider mb-1">
                Did we get these right?
              </h3>
              <p className="font-body text-xs text-mocha mb-3">
                We're not sure. Keep what's actually there, remove what isn't.
              </p>
              <div className="flex flex-wrap gap-2">
                {reviewItems.map((item) => (
                  <ReviewChip
                    key={item.name}
                    item={item}
                    onKeep={() => promote(item.name)}
                    onRemove={() => remove(item.name)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {confirmedItems.length === 0 && reviewItems.length === 0 ? (
              <EmptyState />
            ) : (
              confirmedItems.map((item) => (
                <IngredientChip
                  key={item.name}
                  name={item.name}
                  quantity={item.quantity}
                  confidence={item.confidence}
                  onRemove={() => remove(item.name)}
                />
              ))
            )}
          </div>

          <div className="mt-6 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck="false"
              className="ink-input flex-1"
            />
            <button
              type="button"
              onClick={addDraft}
              className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 shadow-[3px_3px_0_0_var(--color-ink)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[0_0_0_0_var(--color-ink)] transition-transform"
            >
              Add
            </button>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            disabled={items.length === 0}
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

// Reads onboarding preferences and partitions an array of detected
// ingredients into kept/removed buckets. Anything matching the user's
// allergy or custom-avoid list is auto-removed and surfaced via the
// banner so the user can review and re-add if it was a misfire.
function useFilteredInitial(initial) {
  if (!Array.isArray(initial)) return { kept: null, removed: [] };
  const avoid = getHardAvoidList();
  if (avoid.length === 0) return { kept: initial, removed: [] };
  const kept = [];
  const removed = [];
  for (const raw of initial) {
    const norm = normalize(raw);
    if (!norm) continue;
    const hit = ingredientMatchesAvoid(norm.name, avoid);
    if (hit) {
      removed.push({ ...norm, matchedTerm: hit });
    } else {
      kept.push(raw);
    }
  }
  return { kept, removed };
}

function AutoRemovedBanner({ removed, onReadd, onDismiss }) {
  // Single ingredient → friendlier copy; multiple → list them.
  const first = removed[0];
  const oneLine =
    removed.length === 1
      ? `We removed ${first.name} from your ingredients because you marked ${first.matchedTerm} as something you avoid.`
      : `We removed ${removed.length} items you said you avoid:`;

  return (
    <section className="mt-6 brut-card p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none" aria-hidden="true">
          🛡️
        </span>
        <div className="flex-1">
          <p className="font-body text-sm text-ink leading-snug">{oneLine}</p>
          {removed.length > 1 && (
            <ul className="mt-1 font-body text-xs text-mocha">
              {removed.map((r) => (
                <li key={r.name}>
                  <span aria-hidden="true" className="mr-1">
                    {getEmojiForIngredient(r.name)}
                  </span>
                  <span className="capitalize">{r.name}</span>{" "}
                  <span className="text-mocha/70">(avoid: {r.matchedTerm})</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {removed.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => onReadd(r)}
                className="select-chip"
              >
                <span aria-hidden="true">{getEmojiForIngredient(r.name)}</span>
                <span>+ Re-add {r.name}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-ink/45 hover:text-ink w-6 h-6 leading-none"
        >
          ×
        </button>
      </div>
    </section>
  );
}

function ReviewChip({ item, onKeep, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 brut-chip brut-chip-uncertain pr-1">
      <span className="capitalize">{item.name}</span>
      {item.quantity && (
        <span className="text-xs text-mocha">· {item.quantity}</span>
      )}
      <button
        type="button"
        onClick={onKeep}
        className="ml-1 rounded-md bg-sage/15 text-[#3f5e2d] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5"
      >
        Keep
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md bg-terracotta/15 text-terracotta text-[10px] font-bold uppercase tracking-wide px-2 py-0.5"
      >
        Remove
      </button>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="w-full flex flex-col items-center gap-3 py-8 text-center">
      <EmptyBowlSketch />
      <p className="font-script text-xl text-mocha leading-none">
        no ingredients yet — add something tasty
      </p>
    </div>
  );
}

function EmptyBowlSketch() {
  return (
    <svg
      viewBox="0 0 80 50"
      className="w-24 h-16 text-ink/35"
      aria-hidden="true"
    >
      <ellipse
        cx="40"
        cy="22"
        rx="32"
        ry="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M8 22 Q 14 46, 40 47 Q 66 46, 72 22"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30 13 Q 31 8, 33 14"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M40 11 Q 41 6, 43 12"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M50 13 Q 51 8, 53 14"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function HandArrow() {
  return (
    <svg viewBox="0 0 28 16" className="w-7 h-4 inline-block" aria-hidden="true">
      <path
        d="M1 8 Q 12 6, 24 8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M19 3 L 26 8 L 19 13"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function normalize(item) {
  if (typeof item === "string") {
    return {
      name: item.trim().toLowerCase(),
      quantity: null,
      confidence: "high",
      category: "other",
    };
  }
  if (item && typeof item === "object" && typeof item.name === "string") {
    return {
      name: item.name.trim().toLowerCase(),
      quantity:
        typeof item.quantity === "string" && item.quantity.trim()
          ? item.quantity.trim()
          : null,
      confidence: ["high", "medium", "low"].includes(item.confidence)
        ? item.confidence
        : "high",
      category: typeof item.category === "string" ? item.category : "other",
    };
  }
  return null;
}

function dedupe(arr) {
  const seen = new Set();
  const out = [];
  for (const item of arr) {
    if (!item || !item.name) continue;
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    out.push(item);
  }
  return out;
}
