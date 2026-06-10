import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableCard from "../../components/onboarding/SelectableCard.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const OPTIONS = [
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

export default function EditDiet() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [diet, setDiet] = useState(current.diet);

  return (
    <EditorShell
      title="Do you follow any of these?"
      subtitle="pick one"
      saveDisabled={!diet}
      onSave={() => saveCompleted({ ...current, diet })}
    >
      <div className="flex flex-col gap-2.5">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.label}
            selected={diet === opt.value}
            onSelect={() => setDiet(opt.value)}
          />
        ))}
      </div>
    </EditorShell>
  );
}
