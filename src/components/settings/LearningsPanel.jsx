import { useState } from "react";
import { logEvent } from "../../lib/eventTracker.js";

// Visual transparency view of what the profile builder has detected.
// Each chip has a small "×" so the user can suppress a specific learning
// (currently implemented as a "remove" event that the builder reads as
// negative signal — clean override without manual data surgery).

export default function LearningsPanel({ profile, onRefresh }) {
  if (!profile || profile.personalizationLevel === "none") return null;

  return (
    <section className="rounded-2xl bg-white shadow-sm border border-charcoal/10 p-5">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-charcoal">
          What the app has learned
        </h3>
        <span className="text-xs text-charcoal/50 capitalize">
          {profile.personalizationLevel} personalization
        </span>
      </header>
      <p className="text-xs text-charcoal/50 mt-1">
        From {profile.meaningfulEvents} meaningful cooking interactions
      </p>

      {profile.topCuisines.length > 0 && (
        <SubSection title="Top cuisines">
          <CuisineBars
            cuisines={profile.topCuisines}
            onRemove={(cuisine) => {
              logEvent("learning_override", {
                kind: "cuisine_dismissed",
                cuisine,
              });
              onRefresh?.();
            }}
          />
        </SubSection>
      )}

      {profile.ingredientsLoved.length > 0 && (
        <SubSection title="Ingredients you tend to love">
          <ChipRow
            tone="basil"
            items={profile.ingredientsLoved}
            onRemove={(name) => {
              logEvent("learning_override", {
                kind: "ingredient_love_dismissed",
                ingredient: name,
              });
              onRefresh?.();
            }}
          />
        </SubSection>
      )}

      {profile.ingredientsDisliked.length > 0 && (
        <SubSection title="Ingredients we're avoiding">
          <ChipRow
            tone="tomato"
            items={profile.ingredientsDisliked}
            onRemove={(name) => {
              logEvent("learning_override", {
                kind: "ingredient_dislike_dismissed",
                ingredient: name,
              });
              onRefresh?.();
            }}
          />
        </SubSection>
      )}

      {profile.patternsObserved.length > 0 && (
        <SubSection title="Patterns we noticed">
          <ul className="flex flex-col gap-1.5">
            {profile.patternsObserved.map((p) => (
              <li
                key={p}
                className="text-sm text-charcoal/80 bg-cream rounded-lg px-3 py-1.5"
              >
                {p}
              </li>
            ))}
          </ul>
        </SubSection>
      )}

      {profile.avgCookTime != null && (
        <p className="mt-4 text-xs text-charcoal/50">
          Average cook time: {profile.avgCookTime} minutes ·
          {" "}
          difficulty {profile.preferredDifficulty ?? "—"}
        </p>
      )}
    </section>
  );
}

function SubSection({ title, children }) {
  return (
    <div className="mt-5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-charcoal/50 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ChipRow({ items, tone, onRemove }) {
  const tones = {
    basil: "bg-basil/10 text-basil border-basil/30",
    tomato: "bg-tomato/10 text-tomato-deep border-tomato/30",
  };
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((name) => (
        <li
          key={name}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${tones[tone]}`}
        >
          <span className="capitalize">{name}</span>
          <RemoveButton onClick={() => onRemove?.(name)} label={name} />
        </li>
      ))}
    </ul>
  );
}

function CuisineBars({ cuisines, onRemove }) {
  const max = Math.max(1, ...cuisines.map((c) => c.score));
  return (
    <ul className="flex flex-col gap-2">
      {cuisines.slice(0, 3).map((c) => (
        <li key={c.cuisine} className="flex items-center gap-2">
          <span className="capitalize text-sm w-28 shrink-0">{c.cuisine}</span>
          <div className="flex-1 h-2.5 bg-charcoal/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-tomato rounded-full"
              style={{ width: `${Math.max(8, (c.score / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-charcoal/50 w-8 text-right tabular-nums">
            {c.score}
          </span>
          <RemoveButton onClick={() => onRemove?.(c.cuisine)} label={c.cuisine} />
        </li>
      ))}
    </ul>
  );
}

function RemoveButton({ onClick, label }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Confirm dismiss ${label}`}
        className="text-xs font-semibold text-tomato-deep px-1.5 rounded"
      >
        dismiss?
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Dismiss ${label}`}
      className="w-5 h-5 rounded-full text-charcoal/40 hover:text-charcoal hover:bg-charcoal/10 text-base leading-none flex items-center justify-center"
    >
      ×
    </button>
  );
}
