// Shared layout wrapper.
//
// Default behavior: the page is LOCKED to the viewport — a fixed, full-screen
// outer shell that never scrolls, with the centered content column inside it.
// Only pages that pass `scrollable` (currently just the recipe results page)
// grow with content and let the document scroll.
//
// `fitToViewport` is a legacy alias kept so existing call sites keep working;
// locked is now the default, so it has no additional effect.
export default function PageShell({
  children,
  scrollable = false,
  // eslint-disable-next-line no-unused-vars
  fitToViewport = false,
  compact = false,
  maxWidthClass = "max-w-md",
}) {
  // `compact` tightens top/bottom padding for pages (like Home) that need
  // every vertical pixel to fit a dense layout in standard viewport heights.
  const padY = compact ? "pt-3 pb-4" : "pt-8 pb-12";

  // The document itself never scrolls (see index.css html/body lock), so both
  // variants are exactly viewport-tall. Scrollable pages get an internal
  // overflow-y region; locked pages clip. `dvh` tracks the real mobile
  // viewport as browser chrome shows/hides.
  const scrollClasses = scrollable
    ? "overflow-y-auto [-webkit-overflow-scrolling:touch] overscroll-contain"
    : "overflow-hidden";

  return (
    <div
      className={`w-full h-dvh px-5 ${padY} ${maxWidthClass} mx-auto flex flex-col ${scrollClasses}`}
    >
      {children}
    </div>
  );
}
