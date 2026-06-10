import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableChip from "../../components/onboarding/SelectableChip.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const OPTIONS = [
  "Peanuts", "Tree nuts", "Dairy", "Eggs", "Soy", "Wheat / gluten",
  "Shellfish", "Fish", "Sesame", "Pork", "Beef",
];

export default function EditAllergies() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [allergies, setAllergies] = useState(current.allergies || []);
  const [customAvoidList, setCustomAvoidList] = useState(current.customAvoidList || []);
  const [noAllergies, setNoAllergies] = useState(Boolean(current.noAllergies));
  const [draft, setDraft] = useState("");

  const toggle = (label) => {
    const lower = label.toLowerCase();
    setNoAllergies(false);
    setAllergies((prev) =>
      prev.includes(lower) ? prev.filter((a) => a !== lower) : [...prev, lower],
    );
  };

  const handleNone = () => {
    setNoAllergies(true);
    setAllergies([]);
    setCustomAvoidList([]);
  };

  const addCustom = () => {
    const v = draft.trim().toLowerCase();
    if (!v || customAvoidList.includes(v)) {
      setDraft("");
      return;
    }
    setNoAllergies(false);
    setCustomAvoidList((prev) => [...prev, v]);
    setDraft("");
  };

  const removeCustom = (v) =>
    setCustomAvoidList((prev) => prev.filter((x) => x !== v));

  const hasAny = allergies.length > 0 || customAvoidList.length > 0;
  const canSave = noAllergies || hasAny;

  return (
    <EditorShell
      title="Anything you don't eat?"
      subtitle="multi-select — we'll never suggest recipes with these"
      saveDisabled={!canSave}
      onSave={() =>
        saveCompleted({
          ...current,
          allergies,
          customAvoidList,
          noAllergies,
        })
      }
    >
      <div>
        <button
          type="button"
          onClick={handleNone}
          className={`select-chip ${noAllergies ? "is-selected" : ""}`}
        >
          <span aria-hidden="true">✨</span>
          <span>None — eat it all</span>
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {OPTIONS.map((label) => {
          const lower = label.toLowerCase();
          return (
            <SelectableChip
              key={lower}
              label={label}
              selected={allergies.includes(lower)}
              onToggle={() => toggle(label)}
            />
          );
        })}
      </div>

      <label className="block font-serif font-semibold text-[16px] text-ink mt-6 mb-1.5">
        Anything else? Type and add
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="e.g. cilantro, blue cheese"
          className="ink-input flex-1"
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="button"
          onClick={addCustom}
          className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 shadow-[3px_3px_0_0_var(--color-ink)]"
        >
          Add
        </button>
      </div>
      {customAvoidList.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {customAvoidList.map((v) => (
            <SelectableChip
              key={v}
              label={v}
              selected
              removable
              onRemove={() => removeCustom(v)}
            />
          ))}
        </div>
      )}
    </EditorShell>
  );
}
