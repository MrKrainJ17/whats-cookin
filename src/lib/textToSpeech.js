// Speech synthesis helpers. Browser-native; no deps.

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let cachedVoice = null;
let voicesPrimed = false;

function pickVoice() {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  // Prefer en-US, then any en-*, then default.
  return (
    voices.find((v) => v.lang === "en-US" && v.default) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang?.startsWith("en") && v.default) ||
    voices.find((v) => v.lang?.startsWith("en")) ||
    voices[0]
  );
}

// Chrome loads voices async via `voiceschanged`; prime once so we don't miss it.
export function primeVoices() {
  if (!isSpeechSynthesisSupported() || voicesPrimed) return;
  voicesPrimed = true;
  const initial = pickVoice();
  if (initial) cachedVoice = initial;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    const v = pickVoice();
    if (v) cachedVoice = v;
  });
}

// Speak text. Cancels any in-flight utterance first so we never overlap.
export function speak(text, { rate = 0.95, pitch = 1.0, onStart, onEnd } = {}) {
  if (!isSpeechSynthesisSupported() || !text) {
    onEnd?.();
    return;
  }
  primeVoices();
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  u.pitch = pitch;
  u.lang = "en-US";
  const v = cachedVoice || pickVoice();
  if (v) u.voice = v;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function cancelSpeech() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
