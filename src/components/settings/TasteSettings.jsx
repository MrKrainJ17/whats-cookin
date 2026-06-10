import { useState } from "react";
import SelectableCard from "../onboarding/SelectableCard.jsx";
import SelectableChip from "../onboarding/SelectableChip.jsx";
import SpiceSlider from "../onboarding/SpiceSlider.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const DIET_OPTIONS = [
  { value: "none", icon: "🍴", label: "No restrictions" },
  { value: "vegetarian", icon: "🥦", label: "Vegetarian" },
  { value: "vegan", icon: "🌱", label: "Vegan" },
  { value: "pescatarian", icon: "🐟", label: "Pescatarian" },
  { value: "keto", icon: "🥑", label: "Keto" },
  { value: "paleo", icon: "🥩", label: "Paleo" },
  { value: "gluten-free", icon: "🌾", label: "Gluten-free" },
  { value: "dairy-free", icon: "🥛", label: "Dairy-free" },
  { value: "halal", icon: "⚖️", label: "Halal" },
  { value: "kosher", icon: "✡️", label: "Kosher" },
];

const ALLERGY_OPTIONS = [
  "Peanuts",
  "Tree nuts",
  "Dairy",
  "Eggs",
  "Soy",
  "Wheat / gluten",
  "Shellfish",
  "Fish",
  "Sesame",
  "Pork",
  "Beef",
];

const CUISINE_OPTIONS = [
  { value: "italian", icon: "🍝", label: "Italian" },
  { value: "mexican", icon: "🌮", label: "Mexican" },
  { value: "chinese", icon: "🥡", label: "Chinese" },
  { value: "japanese", icon: "🍣", label: "Japanese" },
  { value: "thai", icon: "🍜", label: "Thai" },
  { value: "indian", icon: "🍛", label: "Indian" },
  { value: "mediterranean", icon: "🥙", label: "Mediterranean" },
  { value: "american", icon: "🍔", label: "American" },
  { value: "french", icon: "🥖", label: "French" },
  { value: "korean", icon: "🍱", label: "Korean" },
  { value: "vietnamese", icon: "🍲", label: "Vietnamese" },
  { value: "middle-eastern", icon: "🧆", label: "Middle Eastern" },
  { value: "bbq", icon: "🔥", label: "BBQ" },
  { value: "comfort", icon: "🍲", label: "Comfort food" },
  { value: "healthy", icon: "🥗", label: "Healthy / clean" },
  { value: "fast", icon: "⏱️", label: "Fast & easy" },
];

const SKILL_OPTIONS = [
  { value: "beginner", icon: "🐣", title: "Beginner", subtitle: "I'm learning the basics" },
  { value: "intermediate", icon: "🍳", title: "Intermediate", subtitle: "I can follow recipes confidently" },
  { value: "advanced", icon: "👨‍🍳", title: "Advanced", subtitle: "I love experimenting in the kitchen" },
];

const TIME_OPTIONS = [
  { value: "under-20", icon: "⚡", title: "Under 20 minutes", subtitle: "I want it fast" },
  { value: "20-45", icon: "🍲", title: "20–45 minutes", subtitle: "Standard weeknight cooking" },
  { value: "over-60", icon: "🥘", title: "Over an hour", subtitle: "I love a project recipe" },
  { value: "mixed", icon: "🤷", title: "It depends", subtitle: "Mix it up" },
];

// Editable single-page form of every onboarding survey answer. Saves
// immediately on every change so the user doesn't need to hit a save
// button — debouncing isn't needed because the writes are tiny and
// localStorage is synchronous.
export default function TasteSettings({ onRedoSurvey }) {
  const [prefs, setPrefs] = useState(
    () => getPreferences() || { ...DEFAULT_PREFERENCES },
  );
  const [draftAllergy, setDraftAllergy] = useState("");
  const [draftDislike, setDraftDislike] = useState("");

  const update = (patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveCompleted(next);
      return next;
    });
  };

  const toggleAllergy = (label) => {
    const lower = label.toLowerCase();
    const has = prefs.allergies.includes(lower);
    update({
      allergies: has
        ? prefs.allergies.filter((a) => a !== lower)
        : [...prefs.allergies, lower],
    });
  };

  const toggleCuisine = (value) => {
    const has = prefs.favoriteCuisines.includes(value);
    update({
      favoriteCuisines: has
        ? prefs.favoriteCuisines.filter((c) => c !== value)
        : [...prefs.favoriteCuisines, value],
    });
  };

  const addCustom = (key, value, setter) => {
    const v = value.trim().toLowerCase();
    if (!v || prefs[key].includes(v)) {
      setter("");
      return;
    }
    update({ [key]: [...prefs[key], v] });
    setter("");
  };

  const removeCustom = (key, value) => {
    update({ [key]: prefs[key].filter((v) => v !== value) });
  };

  return (
    <section className="mt-6 brut-card p-5">
      <header className="mb-3">
        <h3 className="font-serif text-xl font-extrabold text-ink leading-none">
          Your Taste
        </h3>
        <p className="font-body text-xs text-mocha mt-1">
          We use these to tune every recipe we suggest. Changes save instantly.
        </p>
      </header>

      <FieldGroup title="Diet">
        <div className="flex flex-col gap-2">
          {DIET_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              icon={opt.icon}
              title={opt.label}
              selected={prefs.diet === opt.value}
              onSelect={() => update({ diet: opt.value })}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Allergies & avoid-list">
        <div className="flex flex-wrap gap-2">
          {ALLERGY_OPTIONS.map((label) => {
            const lower = label.toLowerCase();
            return (
              <SelectableChip
                key={lower}
                label={label}
                selected={prefs.allergies.includes(lower)}
                onToggle={() => toggleAllergy(label)}
              />
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={draftAllergy}
            onChange={(e) => setDraftAllergy(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCustom("customAvoidList", draftAllergy, setDraftAllergy);
              }
            }}
            placeholder="anything else? e.g. cilantro"
            className="ink-input flex-1"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() =>
              addCustom("customAvoidList", draftAllergy, setDraftAllergy)
            }
            className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-3 shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            Add
          </button>
        </div>
        {prefs.customAvoidList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prefs.customAvoidList.map((v) => (
              <SelectableChip
                key={v}
                label={v}
                selected={true}
                removable
                onRemove={() => removeCustom("customAvoidList", v)}
              />
            ))}
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="Spice tolerance">
        <SpiceSlider
          value={prefs.spiceLevel || "any"}
          onChange={(v) => update({ spiceLevel: v })}
        />
      </FieldGroup>

      <FieldGroup title="Favorite cuisines">
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map((opt) => (
            <SelectableChip
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={prefs.favoriteCuisines.includes(opt.value)}
              onToggle={() => toggleCuisine(opt.value)}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Cooking skill">
        <div className="flex flex-col gap-2">
          {SKILL_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              icon={opt.icon}
              title={opt.title}
              subtitle={opt.subtitle}
              selected={prefs.skillLevel === opt.value}
              onSelect={() => update({ skillLevel: opt.value })}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Time commitment">
        <div className="flex flex-col gap-2">
          {TIME_OPTIONS.map((opt) => (
            <SelectableCard
              key={opt.value}
              icon={opt.icon}
              title={opt.title}
              subtitle={opt.subtitle}
              selected={prefs.timePreference === opt.value}
              onSelect={() => update({ timePreference: opt.value })}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup title="Ingredient dislikes">
        <div className="flex gap-2">
          <input
            type="text"
            value={draftDislike}
            onChange={(e) => setDraftDislike(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCustom("ingredientDislikes", draftDislike, setDraftDislike);
              }
            }}
            placeholder="mushrooms, olives, blue cheese…"
            className="ink-input flex-1"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() =>
              addCustom("ingredientDislikes", draftDislike, setDraftDislike)
            }
            className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-3 shadow-[3px_3px_0_0_var(--color-ink)]"
          >
            Add
          </button>
        </div>
        {prefs.ingredientDislikes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {prefs.ingredientDislikes.map((v) => (
              <SelectableChip
                key={v}
                label={v}
                selected={true}
                removable
                onRemove={() => removeCustom("ingredientDislikes", v)}
              />
            ))}
          </div>
        )}
      </FieldGroup>

      <div className="mt-5 pt-5 border-t border-ink/15">
        <button
          type="button"
          onClick={onRedoSurvey}
          className="w-full text-left rounded-xl border-2 border-ink bg-paper-warm hover:bg-[#fef1e2] px-4 py-3 text-sm font-body font-semibold text-ink shadow-[3px_3px_0_0_var(--color-ink)]"
        >
          Redo the welcome survey
          <span className="block text-xs text-mocha font-normal mt-0.5">
            Resets your preferences and re-runs the full onboarding flow.
          </span>
        </button>
      </div>
    </section>
  );
}

function FieldGroup({ title, children }) {
  return (
    <div className="mt-5 first:mt-0">
      <h4 className="font-script text-lg text-ink leading-none mb-3">{title}</h4>
      {children}
    </div>
  );
}
