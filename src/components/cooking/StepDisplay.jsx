// Picks an emoji from the instruction text. Heuristic, harmless if it misses.
const KEYWORD_EMOJI = [
  [/\b(boil|simmer|heat|saut|fry|sear|cook|warm)/i, "🔥"],
  [/\b(bake|oven|roast)/i, "🔥"],
  [/\b(stir|mix|whisk|fold|combine|toss)/i, "🥄"],
  [/\b(chop|slice|dice|mince|cut|julienne|peel)/i, "🔪"],
  [/\b(salt|season|pepper|sprinkle)/i, "🧂"],
  [/\b(taste|sample)/i, "👅"],
  [/\b(drain|rinse|wash)/i, "🚿"],
  [/\b(serve|plate|garnish)/i, "🍽️"],
  [/\b(blend|puree|process)/i, "🌀"],
  [/\b(rest|cool|chill|cover)/i, "❄️"],
  [/\b(grate|shred|crush|grind)/i, "🧀"],
  [/\b(pour|drizzle|add)/i, "🫗"],
];

function pickEmoji(text) {
  if (!text) return "👨‍🍳";
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(text)) return emoji;
  }
  return "👨‍🍳";
}

export default function StepDisplay({ step, animKey, direction, tip }) {
  const emoji = pickEmoji(step?.instruction);
  const animationClass =
    direction === "back"
      ? "step-anim-in-back"
      : "step-anim-in-forward";

  return (
    <div
      key={animKey}
      className={`flex flex-col items-center text-center ${animationClass}`}
    >
      <div
        className="text-5xl sm:text-6xl mb-4 select-none"
        aria-hidden="true"
      >
        {emoji}
      </div>
      <p
        className="text-3xl sm:text-4xl md:text-5xl leading-snug font-semibold text-stone-900 max-w-2xl px-4"
        aria-live="polite"
      >
        {step?.instruction}
      </p>
      {tip && (
        <p className="mt-4 text-base text-stone-600 max-w-xl px-4 italic animate-fadeIn">
          💡 {tip}
        </p>
      )}
    </div>
  );
}
