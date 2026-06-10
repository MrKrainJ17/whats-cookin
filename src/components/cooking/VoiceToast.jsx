export default function VoiceToast({ message, kind }) {
  if (!message) return null;
  const tone =
    kind === "unknown"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : kind === "recognized"
      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
      : "bg-stone-100 text-stone-800 border-stone-300";
  return (
    <div
      aria-live="polite"
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-[90vw] px-4 py-2 rounded-full border text-sm font-medium shadow-md animate-fadeIn ${tone}`}
    >
      {message}
    </div>
  );
}
