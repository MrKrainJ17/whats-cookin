// Shared layout wrapper. Default behavior: at least viewport-tall, grows
// with content (Recipes, RecipeDetail, etc. that scroll naturally).
//
// `fitToViewport` locks the shell to exactly viewport-tall and clips any
// overflow — used by Home so the composition (logo + title + buttons +
// footer) always loads in its centered state without the page being
// scrollable. Uses `dvh` (dynamic viewport height) so mobile browser
// chrome show/hide doesn't break the layout.
export default function PageShell({
  children,
  fitToViewport = false,
  compact = false,
}) {
  // `compact` tightens top/bottom padding for pages (like Home) that need
  // every vertical pixel to fit a dense layout in standard viewport
  // heights without forcing the user to scroll.
  const padY = compact ? "pt-3 pb-4" : "pt-8 pb-12";
  return (
    <div
      className={`w-full px-5 ${padY} max-w-md mx-auto flex flex-col ${
        fitToViewport ? "h-dvh overflow-hidden" : "min-h-dvh"
      }`}
    >
      {children}
    </div>
  );
}
