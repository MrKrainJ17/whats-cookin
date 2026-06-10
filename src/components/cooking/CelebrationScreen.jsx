import { useEffect, useRef } from "react";
import { useSession } from "../../lib/sessionContext.js";

// onSave receives an optional rating: 'loved' | 'fine' | 'never_again' | null.
// CookingMode logs both recipe_cooked and recipe_rated when a rating is given.
export default function CelebrationScreen({ recipe, onSave, onSkip }) {
  const { session } = useSession();
  const fullName = session?.user?.user_metadata?.full_name || "";
  const firstName = fullName.trim().split(/\s+/)[0] || "";
  const headline = firstName ? `Nice work, ${firstName}!` : "You did it!";
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 flex items-center justify-center overflow-hidden">
      <Confetti />
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md w-full">
        <div className="text-7xl mb-2 animate-bounce" aria-hidden="true">
          🎉
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold text-stone-900">
          {headline}
        </h2>
        <p className="mt-3 text-stone-700 text-lg">{recipe.name}</p>
        <p className="mt-6 text-stone-600">How was it?</p>
        <div className="mt-3 w-full grid grid-cols-1 sm:grid-cols-3 gap-2">
          <RatingButton
            tone="emerald"
            onClick={() => onSave("loved")}
          >
            ❤️ Loved it
          </RatingButton>
          <RatingButton
            tone="amber"
            onClick={() => onSave("fine")}
          >
            🤷 It was fine
          </RatingButton>
          <RatingButton
            tone="rose"
            onClick={() => onSave("never_again")}
          >
            🙅 Never again
          </RatingButton>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="mt-4 text-stone-500 hover:text-stone-700 text-sm font-medium"
        >
          Skip rating
        </button>
      </div>
    </div>
  );
}

function RatingButton({ tone, onClick, children }) {
  const tones = {
    emerald: "bg-emerald-500 hover:bg-emerald-600 text-white",
    amber: "bg-amber-400 hover:bg-amber-500 text-stone-900",
    rose: "bg-rose-500 hover:bg-rose-600 text-white",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl font-bold text-base py-3 shadow active:scale-[0.98] transition ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const colors = ["#ff5a3c", "#f5b700", "#2f9e44", "#aa3bff", "#ff8a3d", "#3b82f6"];
    const N = 110;
    const particles = Array.from({ length: N }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 80,
      y: h / 3 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 4,
      gravity: 0.28 + Math.random() * 0.1,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
    }));

    let raf;
    const startedAt = performance.now();

    const draw = (t) => {
      const elapsed = t - startedAt;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.vy += p.gravity;
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (elapsed < 4500) {
        raf = requestAnimationFrame(draw);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
