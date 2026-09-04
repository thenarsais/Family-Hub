import { useState, type ReactNode } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';

/**
 * DashboardCard (FR-131) — a widget shell with two states: compact (body
 * clamped) and expanded (full body + actions), toggled from the header. A drag
 * handle reorders cards (HTML5 DnD, plus ArrowUp/Down for keyboard); the parent
 * owns the order via useCardOrder.
 */
export function DashboardCard({
  id,
  title,
  icon,
  count,
  expanded,
  onToggle,
  onReorder,
  onMove,
  footer,
  children,
}: {
  id: string;
  title: string;
  icon?: ReactNode;
  count?: ReactNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  onReorder: (dragId: string, dropId: string) => void;
  onMove: (id: string, delta: number) => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [dragOver, setDragOver] = useState(false);
  const bodyId = `card-body-${id}`;

  return (
    <section
      aria-labelledby={`card-title-${id}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const dragId = e.dataTransfer.getData('text/dashboard-card');
        if (dragId && dragId !== id) onReorder(dragId, id);
      }}
      className={`card transition-shadow ${dragOver ? 'ring-2 ring-accent' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          aria-label={`Reorder ${title} (use arrow keys)`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/dashboard-card', id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
              e.preventDefault();
              onMove(id, -1);
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
              e.preventDefault();
              onMove(id, 1);
            }
          }}
          className="shrink-0 -ml-1 p-1 rounded text-ink-3 hover:text-accent cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <GripVertical className="w-4 h-4" aria-hidden="true" />
        </button>

        <h2 id={`card-title-${id}`} className="flex-1 min-w-0 m-0">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => onToggle(id)}
            className="flex items-center gap-2 w-full text-left font-display text-lg font-semibold text-ink"
          >
            {icon}
            <span className="truncate">{title}</span>
            {count != null && (
              <span className="ml-auto text-xs font-semibold text-ink-3">{count}</span>
            )}
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-ink-3 transition-transform ${
                count != null ? '' : 'ml-auto'
              } ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </h2>
      </div>

      <div
        id={bodyId}
        className={expanded ? '' : 'relative max-h-52 overflow-hidden'}
      >
        {children}
        {!expanded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-raised to-transparent"
          />
        )}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </section>
  );
}

export default DashboardCard;
