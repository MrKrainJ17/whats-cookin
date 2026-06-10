import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableChip from "../../components/onboarding/SelectableChip.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

export default function EditDislikes() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [ingredientDislikes, setIngredientDislikes] = useState(
    current.ingredientDislikes || [],
  );
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim().toLowerCase();
    if (!v) return;
    if (ingredientDislikes.includes(v)) {
      setDraft("");
      return;
    }
    setIngredientDislikes((prev) => [...prev, v]);
    setDraft("");
  };

  const remove = (v) =>
    setIngredientDislikes((prev) => prev.filter((x) => x !== v));

  return (
    <EditorShell
      title="Any ingredients you don't like?"
      subtitle="be specific — we'll quietly avoid them"
      onSave={() => saveCompleted({ ...current, ingredientDislikes })}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
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
          onClick={add}
          className="font-serif font-bold text-ink bg-paper-warm border-2 border-ink rounded-lg px-4 shadow-[3px_3px_0_0_var(--color-ink)]"
        >
          Add
        </button>
      </div>
      {ingredientDislikes.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {ingredientDislikes.map((v) => (
            <SelectableChip
              key={v}
              label={v}
              selected
              removable
              onRemove={() => remove(v)}
            />
          ))}
        </div>
      ) : (
        <p className="font-script text-base text-mocha/85 mt-4 leading-snug">
          nothing yet — totally fine to leave empty
        </p>
      )}
    </EditorShell>
  );
}
