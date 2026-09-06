import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { QUICK_ADD_ITEMS, type ShoppingItem } from '../../hooks/useShoppingList';

interface ShoppingWidgetProps {
  items: ShoppingItem[];
  onAdd: (name: string) => void | Promise<void>;
  onToggle: (id: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
  onClearChecked: () => void | Promise<void>;
}

/**
 * FR-087 / T-17 — the interactive body of the dashboard "Shopping List" card:
 * quick-add chips, a free-text add row, tap-to-check items (checked ones sink
 * and strike through), per-row remove, and a "clear checked" action.
 */
export function ShoppingWidget({
  items,
  onAdd,
  onToggle,
  onRemove,
  onClearChecked,
}: ShoppingWidgetProps) {
  const [draft, setDraft] = useState('');

  const pending = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const existing = new Set(items.map((i) => i.name.trim().toLowerCase()));
  const quickAdds = QUICK_ADD_ITEMS.filter((n) => !existing.has(n.toLowerCase()));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    void onAdd(name);
    setDraft('');
  };

  return (
    <div className="space-y-3">
      {quickAdds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quickAdds.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => void onAdd(name)}
              className="text-xs px-2 py-1 rounded-full border border-rule text-ink-2
                         hover:border-accent hover:text-accent transition-colors"
            >
              + {name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
          aria-label="Add a shopping item"
          className="input py-1 text-sm"
        />
        <button type="submit" className="btn btn-secondary btn-small shrink-0" aria-label="Add item">
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      <p className="text-sm text-ink-2">
        {pending.length} of {items.length} item{items.length === 1 ? '' : 's'} still needed
      </p>

      <ul className="space-y-1 text-sm">
        {[...pending, ...checked].map((item) => (
          <li key={item.id} className="flex items-center gap-2 group">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => void onToggle(item.id)}
              aria-label={item.name}
              className="accent-accent shrink-0"
            />
            <span className={`flex-1 ${item.checked ? 'line-through text-ink-3' : 'text-ink'}`}>
              {item.name}
            </span>
            <button
              type="button"
              onClick={() => void onRemove(item.id)}
              aria-label={`Remove ${item.name}`}
              className="shrink-0 text-ink-3 hover:text-ink-2 opacity-0 group-hover:opacity-100
                         focus:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {checked.length > 0 && (
        <button
          type="button"
          onClick={() => void onClearChecked()}
          className="text-xs text-ink-2 hover:text-accent transition-colors"
        >
          Clear {checked.length} checked
        </button>
      )}
    </div>
  );
}
