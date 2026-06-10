export default function IngredientsSheet({
  ingredients,
  checks, // Set of indices marked added
  onToggle,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full sm:max-w-lg max-h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slideUp">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-bold text-lg text-stone-900">Ingredients</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xl leading-none flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
          {ingredients.map((ing, i) => {
            const checked = checks.has(i);
            const amountUnit = [ing.amount, ing.unit]
              .filter(Boolean)
              .join(" ")
              .trim();
            return (
              <li key={`${ing.name}-${i}`}>
                <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl px-3 py-2.5 hover:bg-stone-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(i)}
                    className="w-5 h-5 accent-tomato"
                  />
                  <span
                    className={`flex-1 text-base ${
                      checked
                        ? "text-stone-400 line-through"
                        : "text-stone-900"
                    }`}
                  >
                    <span className="capitalize">{ing.name}</span>
                    {amountUnit && (
                      <span className="text-stone-500"> — {amountUnit}</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
