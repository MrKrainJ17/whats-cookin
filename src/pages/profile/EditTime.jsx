import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableCard from "../../components/onboarding/SelectableCard.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const OPTIONS = [
  { value: "under-20", icon: "⚡", title: "Under 20 minutes", subtitle: "I want it fast" },
  { value: "20-45", icon: "🍲", title: "20–45 minutes", subtitle: "Standard weeknight cooking" },
  { value: "over-60", icon: "🥘", title: "Over an hour", subtitle: "I love a project recipe" },
  { value: "mixed", icon: "🤷", title: "It depends", subtitle: "Mix it up" },
];

export default function EditTime() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [timePreference, setTimePreference] = useState(current.timePreference);

  return (
    <EditorShell
      title="How much time do you have?"
      subtitle="pick one"
      saveDisabled={!timePreference}
      onSave={() => saveCompleted({ ...current, timePreference })}
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={timePreference === opt.value}
            onSelect={() => setTimePreference(opt.value)}
          />
        ))}
      </div>
    </EditorShell>
  );
}
