import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SelectableCard from "../../components/onboarding/SelectableCard.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

const OPTIONS = [
  { value: "beginner", icon: "🐣", title: "Beginner", subtitle: "I'm learning the basics" },
  { value: "intermediate", icon: "🍳", title: "Intermediate", subtitle: "I can follow recipes confidently" },
  { value: "advanced", icon: "👨‍🍳", title: "Advanced", subtitle: "I love experimenting in the kitchen" },
];

export default function EditSkill() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [skillLevel, setSkillLevel] = useState(current.skillLevel);

  return (
    <EditorShell
      title="How would you describe your cooking?"
      subtitle="pick one"
      saveDisabled={!skillLevel}
      onSave={() => saveCompleted({ ...current, skillLevel })}
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => (
          <SelectableCard
            key={opt.value}
            icon={opt.icon}
            title={opt.title}
            subtitle={opt.subtitle}
            selected={skillLevel === opt.value}
            onSelect={() => setSkillLevel(opt.value)}
          />
        ))}
      </div>
    </EditorShell>
  );
}
