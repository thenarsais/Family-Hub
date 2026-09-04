import { useCallback, useMemo, useState } from 'react';

/**
 * Persisted dashboard card order (FR-131). Keyed per profile so each family
 * member keeps their own arrangement. Unknown / new ids fall to the end in
 * their declared order; removed ids are dropped.
 */
export function useCardOrder(profileKey: string, defaultIds: string[]) {
  const storageKey = `fh:cardOrder:${profileKey}`;

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? JSON.parse(raw) : null;
      if (Array.isArray(saved)) {
        const known = saved.filter((id) => defaultIds.includes(id));
        const missing = defaultIds.filter((id) => !known.includes(id));
        return [...known, ...missing];
      }
    } catch {
      /* private mode / corrupt value — fall through to defaults */
    }
    return defaultIds;
  });

  const commit = useCallback(
    (next: string[]) => {
      setOrder(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage disabled — order just won't persist across reloads */
      }
    },
    [storageKey],
  );

  const move = useCallback(
    (id: string, delta: number) => {
      setOrder((cur) => {
        const from = cur.indexOf(id);
        if (from === -1) return cur;
        const to = Math.max(0, Math.min(cur.length - 1, from + delta));
        if (to === from) return cur;
        const next = [...cur];
        next.splice(to, 0, next.splice(from, 1)[0]);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const reorder = useCallback(
    (dragId: string, dropId: string) => {
      setOrder((cur) => {
        const from = cur.indexOf(dragId);
        const to = cur.indexOf(dropId);
        if (from === -1 || to === -1 || from === to) return cur;
        const next = [...cur];
        next.splice(to, 0, next.splice(from, 1)[0]);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  const sort = useMemo(
    () =>
      <T,>(items: T[], idOf: (item: T) => string): T[] => {
        const rank = new Map(order.map((id, i) => [id, i]));
        return [...items].sort((a, b) => (rank.get(idOf(a)) ?? 999) - (rank.get(idOf(b)) ?? 999));
      },
    [order],
  );

  return { order, move, reorder, commit, sort };
}
