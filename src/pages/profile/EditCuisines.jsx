import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableChip from "../../components/onboarding/SelectableChip.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const OPTIONS = [
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

export default function EditCuisines() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [favoriteCuisines, setFavoriteCuisines] = useState(
    current.favoriteCuisines || [],
  );

  const toggle = (value) => {
    setFavoriteCuisines((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  };

  return (
    <EditorShell
      title="What do you love to eat?"
      subtitle={
        favoriteCuisines.length === 0
          ? "pick at least one"
          : `${favoriteCuisines.length} picked — keep going if you like`
      }
      saveDisabled={favoriteCuisines.length === 0}
      onSave={() => saveCompleted({ ...current, favoriteCuisines })}
    >
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <SelectableChip
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            selected={favoriteCuisines.includes(opt.value)}
            onToggle={() => toggle(opt.value)}
          />
        ))}
      </div>
    </EditorShell>
  );
}
