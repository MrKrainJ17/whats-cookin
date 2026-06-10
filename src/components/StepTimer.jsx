import { useEffect, useRef, useState } from "react";

export default function StepTimer({ minutes, label }) {
  const totalSeconds = Math.max(1, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const start = () => {
    if (running) return;
    setDone(false);
    setRemaining(totalSeconds);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          // Best-effort beep — falls back silently if blocked.
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => {
              osc.stop();
              ctx.close();
            }, 600);
          } catch {
            /* no audio, no problem */
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const cancel = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setRemaining(totalSeconds);
  };

  if (done) {
    return (
      <button
        type="button"
        onClick={() => {
          setDone(false);
          setRemaining(totalSeconds);
        }}
        className="inline-flex items-center gap-1 rounded-full bg-basil/15 text-basil font-semibold px-3 py-1 text-xs"
      >
        ✓ Done — reset
      </button>
    );
  }

  if (running) {
    return (
      <button
        type="button"
        onClick={cancel}
        className="inline-flex items-center gap-1 rounded-full bg-tomato/15 text-tomato-deep font-semibold px-3 py-1 text-xs tabular-nums"
      >
        ⏱ {formatTime(remaining)} · cancel
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={start}
      className="inline-flex items-center gap-1 rounded-full bg-charcoal/10 hover:bg-charcoal/15 text-charcoal font-semibold px-3 py-1 text-xs"
      aria-label={label ?? `Start ${minutes} minute timer`}
    >
      ⏱ Start {minutes} min
    </button>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
