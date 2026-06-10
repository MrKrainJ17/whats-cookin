export default function MicToggle({
  supported,
  enabled,
  listening,
  recognized,
  onToggle,
}) {
  if (!supported) return null;

  const stateLabel = !enabled
    ? "Off"
    : listening
    ? "Listening…"
    : "Voice on";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={
        enabled ? "Turn voice control off" : "Turn voice control on"
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-10 text-xs font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-tomato/40
        ${
          enabled
            ? recognized
              ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400"
              : "bg-rose-100 text-rose-800"
            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
        }`}
    >
      <span aria-hidden="true" className="text-base">
        {enabled ? "🎙️" : "🎤"}
      </span>
      {enabled && (
        <span
          aria-hidden="true"
          className={`inline-block w-2 h-2 rounded-full ${
            listening
              ? "bg-rose-500 animate-pulse"
              : "bg-stone-400"
          }`}
        />
      )}
      <span className="hidden sm:inline">{stateLabel}</span>
    </button>
  );
}
