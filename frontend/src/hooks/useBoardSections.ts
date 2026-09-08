import { useCallback, useMemo, useState } from 'react';

/**
 * The Activity Board is a stack of collapsible sections (Chores today, and more
 * to come). Order and per-section collapse state are persisted per profile so
 * each family member keeps their own board. Unknown / new ids fall to the end
 * in their declared order; removed ids are dropped.
 */
export function useBoardSections(profileKey: string, defaultIds: string[]) {
  const orderKey = `fh:boardOrder:${profileKey}`;
  const collapsedKey = `fh:boardCollapsed:${profileKey}`;

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(orderKey) || 'null');
      if (Array.isArray(saved)) {
        const known = saved.filter((id) => defaultIds.includes(id));
        return [...known, ...defaultIds.filter((id) => !known.includes(id))];
      }
    } catch {
      /* private mode / corrupt value — fall through */
    }
    return defaultIds;
  });

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(collapsedKey) || 'null');
      if (saved && typeof saved === 'object') return saved as Record<string, boolean>;
    } catch {
      /* ignore */
    }
    return {};
  });

  const persist = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage disabled — state just won't persist across reloads */
    }
  };

  const move = useCallback(
    (id: string, delta: number) => {
      setOrder((cur) => {
        const from = cur.indexOf(id);
        if (from === -1) return cur;
        const to = Math.max(0, Math.min(cur.length - 1, from + delta));
        if (to === from) return cur;
        const next = [...cur];
        next.splice(to, 0, next.splice(from, 1)[0]);
        persist(orderKey, next);
        return next;
      });
    },
    [orderKey],
  );

  const toggle = useCallback(
    (id: string) => {
      setCollapsed((cur) => {
        const next = { ...cur, [id]: !cur[id] };
        persist(collapsedKey, next);
        return next;
      });
    },
    [collapsedKey],
  );

  const sorted = useMemo(() => {
    const rank = new Map(order.map((id, i) => [id, i]));
    return [...defaultIds].sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999));
  }, [order, defaultIds]);

  return { sorted, collapsed, move, toggle };
}
