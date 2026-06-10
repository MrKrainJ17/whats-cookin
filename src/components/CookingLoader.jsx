import WhiskLoader from "./handDrawn/WhiskLoader.jsx";

// In-page (not full-viewport) loader used while recipes are streaming.
// Calm whisk SVG + serif heading + handwritten reassurance.
export default function CookingLoader({
  message = "Cooking up 5 recipes for you…",
  hint = "we're thinking…",
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
      <WhiskLoader size={84} />
      <p className="font-serif text-2xl font-bold text-ink leading-snug">
        {message}
      </p>
      <p className="font-script text-lg text-mocha leading-none">{hint}</p>
    </div>
  );
}
