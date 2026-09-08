import { useState, type FormEvent } from 'react';
import { ShoppingCart, Plus, X } from 'lucide-react';
import { useShoppingList, QUICK_ADD_ITEMS } from '@hooks/useShoppingList';
import { useFamily } from '@hooks/useFamily';

/**
 * FR-087 / T-17 — the full-page shopping list the dashboard card's "View Full
 * List" links to. Same data as the card widget (`useShoppingList`), with room
 * for who-added tags, bigger tap targets for the wall display, and the whole
 * quick-add set always visible.
 */
export default function ShoppingListPage() {
  const { items, loading, error, addItem, toggleItem, removeItem, clearChecked } = useShoppingList();
  const { members } = useFamily();
  const [draft, setDraft] = useState('');

  const memberName = (userId: string | null) =>
    members.find((m) => m.user_id === userId)?.name ?? null;

  const pending = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const existing = new Set(items.map((i) => i.name.trim().toLowerCase()));
  const quickAdds = QUICK_ADD_ITEMS.filter((n) => !existing.has(n.toLowerCase()));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    void addItem(name);
    setDraft('');
  };

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-leaf" aria-hidden="true" />
          Shopping list
        </h1>
        <p className="text-ink-2 text-sm mt-1">
          Shared with the whole family — anyone can add, check off, or clear.
        </p>
      </header>

      <section className="card space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Add an item</h2>
        {quickAdds.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {quickAdds.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => void addItem(name)}
                className="text-sm px-2.5 py-1 rounded-full border border-rule text-ink-2
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
            className="input"
          />
          <button type="submit" className="btn btn-primary btn-small shrink-0" aria-label="Add item">
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </section>

      <section className="card">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg font-bold text-ink">
            List{' '}
            <span className="text-ink-3 text-sm font-normal">
              ({pending.length} of {items.length} still needed)
            </span>
          </h2>
          {checked.length > 0 && (
            <button
              type="button"
              onClick={() => void clearChecked()}
              className="text-sm text-ink-2 hover:text-accent transition-colors"
            >
              Clear {checked.length} checked
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-6 flex justify-center" role="status" aria-label="Loading">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
          </div>
        ) : (
          <>
            {error && (
              <p className="text-sm text-alert bg-alert/10 rounded p-2 mb-3">
                Couldn&apos;t load the list: {error}
              </p>
            )}
            {items.length === 0 ? (
              <p className="text-sm text-ink-3">Nothing on the list.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {[...pending, ...checked].map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5 group">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => void toggleItem(item.id)}
                      aria-label={item.name}
                      className="accent-accent shrink-0 w-4 h-4"
                    />
                    <span
                      className={`flex-1 ${item.checked ? 'line-through text-ink-3' : 'text-ink'}`}
                    >
                      {item.name}
                    </span>
                    {memberName(item.addedById) && (
                      <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-ink-3 border border-rule-2 rounded px-1">
                        {memberName(item.addedById)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="shrink-0 text-ink-3 hover:text-alert opacity-0 group-hover:opacity-100
                                 focus:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </main>
  );
}
