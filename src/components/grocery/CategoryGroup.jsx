import GroceryItem from "./GroceryItem.jsx";

// Wraps one category section: icon + label heading, then the items.
// Items keep their order even when checked so the user's eyes don't have
// to track jumping rows mid-shopping.
export default function CategoryGroup({ category, items, onToggle, onRemove }) {
  return (
    <section className="mt-6 first:mt-2">
      <header className="flex items-baseline gap-2 mb-1.5">
        <span aria-hidden="true" className="text-base">
          {category.icon}
        </span>
        <h3 className="font-serif text-lg font-extrabold text-ink leading-none">
          {category.label}
        </h3>
        <span className="font-body text-xs text-mocha">
          · {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </header>
      <ul className="flex flex-col">
        {items.map((item) => (
          <GroceryItem
            key={item.id}
            item={item}
            onToggle={onToggle}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}
