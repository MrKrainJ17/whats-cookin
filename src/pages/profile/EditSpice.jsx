import { useState } from "react";
import EditorShell from "../../components/profile/EditorShell.jsx";
import SpiceSlider from "../../components/onboarding/SpiceSlider.jsx";
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  saveCompleted,
} from "../../lib/preferences.js";

export default function EditSpice() {
  const current = getPreferences() || { ...DEFAULT_PREFERENCES };
  const [spiceLevel, setSpiceLevel] = useState(current.spiceLevel || "any");

  return (
    <EditorShell
      title="How spicy do you like it?"
      subtitle="tap a heat level"
      onSave={() => saveCompleted({ ...current, spiceLevel })}
    >
      <div className="mt-2">
        <SpiceSlider value={spiceLevel} onChange={setSpiceLevel} />
        <p className="font-script text-base text-mocha mt-6 text-center leading-snug">
          we'll calibrate every recipe to match
        </p>
      </div>
    </EditorShell>
  );
}
