import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ExploreCategory } from '@/data/exploreCategories';

interface Props {
  categories: ExploreCategory[];
}

/**
 * Tap a category → its emoji grid opens in place. Tap an item and it just pops —
 * no scoring, no navigation, no sound (v1).
 */
export default function CategoryExplorer({ categories }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [poppedKey, setPoppedKey] = useState<string | null>(null);
  const open = categories.find((c) => c.id === openId) ?? null;

  const popItem = (key: string) => {
    setPoppedKey(key);
    // let the same tile re-trigger the animation next time
    window.setTimeout(() => setPoppedKey((k) => (k === key ? null : k)), 320);
  };

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-ink mb-3">
        <span aria-hidden="true">✨</span> Look and learn
      </h2>

      {open === null ? (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className="w-full aspect-square rounded-2xl border-4 border-rule bg-raised hover:border-accent active:scale-95 transition flex flex-col items-center justify-center gap-1"
              >
                <span className="text-5xl leading-none" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className="text-sm font-semibold text-ink">{c.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setOpenId(null)}
            className="btn btn-secondary btn-small gap-1 mb-3"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
          <h3 className="font-display text-xl font-bold text-ink mb-2">
            <span aria-hidden="true">{open.emoji}</span> {open.title}
          </h3>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {open.items.map((it) => {
              const key = `${open.id}:${it.label}`;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => popItem(key)}
                    aria-label={it.label}
                    className={`w-full aspect-square rounded-2xl border-4 border-rule bg-raised hover:border-accent active:scale-95 transition flex flex-col items-center justify-center gap-1 ${
                      poppedKey === key ? 'animate-pop' : ''
                    }`}
                  >
                    <span className="text-4xl leading-none" aria-hidden="true">
                      {it.emoji}
                    </span>
                    <span className="text-xs font-semibold text-ink-2">{it.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
