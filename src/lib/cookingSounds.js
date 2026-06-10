// Web Audio chimes and timer alarms — no audio files, no deps.
// AudioContext must be created/resumed after a user gesture on most
// mobile browsers, so we lazy-init.

let ctx = null;

function getCtx() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function playTone({
  freq,
  start = 0,
  duration = 0.4,
  gain = 0.18,
  type = "sine",
}) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(env).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Soft tick when advancing to the next step.
export function playStepAdvanceChime() {
  playTone({ freq: 880, duration: 0.18, gain: 0.12, type: "sine" });
}

// Three gentle bell tones — the timer's "time's up" alarm.
// Layered fifth (C5 + G5) so it sounds bell-like, not beepy.
export function playTimerAlarm() {
  for (let i = 0; i < 3; i++) {
    const offset = i * 0.28;
    playTone({ freq: 523.25, start: offset, duration: 0.45, gain: 0.16 });
    playTone({ freq: 783.99, start: offset, duration: 0.45, gain: 0.1 });
  }
}

// Best-effort device vibration; harmless when unsupported.
export function vibrateAlarm() {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
}

// Prime the AudioContext from inside a user-gesture handler so subsequent
// programmatic plays (timer fires while no gesture is happening) actually sound.
export function primeAudio() {
  getCtx();
}
