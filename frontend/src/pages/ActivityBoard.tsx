import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFamily } from '@hooks/useFamily';
import { useChores } from '@hooks/useChores';
import { useBoardSections } from '@hooks/useBoardSections';
import ChoresSection from '@components/activity/ChoresSection';
import ChoreManagePanel from '@components/activity/ChoreManagePanel';

/** Board sections in their default order. Chores is the only one built for v1;
 *  the shell is here so Games / Reading / Habits slot in without a rewrite. */
const SECTIONS = [{ id: 'chores', title: 'Chores today', emoji: '🧹' }];
const SECTION_IDS = SECTIONS.map((s) => s.id);

export default function ActivityBoard() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const chores = useChores();

  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;

  const profileKey = user?.id || 'anon';
  const { sorted, collapsed, move, toggle } = useBoardSections(profileKey, SECTION_IDS);

  const [managing, setManaging] = useState(false);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink">Activity Board</h1>
        <p className="text-ink-2 text-sm mt-1">
          Tap a chore when it's done to earn its points. Everything resets overnight.
        </p>
      </header>

      {chores.error && (
        <p className="text-sm text-alert bg-alert/10 rounded p-3">{chores.error}</p>
      )}

      {sorted.map((id, i) => {
        const meta = SECTIONS.find((s) => s.id === id);
        if (!meta) return null;
        const isCollapsed = collapsed[id];
        return (
          <section key={id} className="card">
            <div className="flex items-center gap-2">
              <button
                className="flex flex-1 items-center gap-2 text-left"
                onClick={() => toggle(id)}
                aria-expanded={!isCollapsed}
              >
                <span className="text-lg">{meta.emoji}</span>
                <h2 className="font-display text-lg font-bold text-ink">{meta.title}</h2>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-ink-3" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-ink-3" />
                )}
              </button>

              {id === 'chores' && canManage && !isCollapsed && (
                <button
                  className="btn btn-secondary btn-small gap-1"
                  onClick={() => setManaging((v) => !v)}
                  aria-pressed={managing}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  {managing ? 'Done' : 'Manage'}
                </button>
              )}

              {sorted.length > 1 && (
                <span className="flex flex-col">
                  <button
                    className="text-ink-3 hover:text-accent disabled:opacity-30"
                    aria-label={`Move ${meta.title} up`}
                    disabled={i === 0}
                    onClick={() => move(id, -1)}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="text-ink-3 hover:text-accent disabled:opacity-30"
                    aria-label={`Move ${meta.title} down`}
                    disabled={i === sorted.length - 1}
                    onClick={() => move(id, 1)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>

            {!isCollapsed && id === 'chores' && (
              <div className="mt-4">
                {chores.loading ? (
                  <div className="py-6 flex justify-center" role="status" aria-label="Loading">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                  </div>
                ) : (
                  <ChoresSection
                    chores={chores.chores}
                    pointsSummary={chores.pointsSummary}
                    onComplete={chores.complete}
                    onUndo={chores.undo}
                  />
                )}

                {managing && canManage && user?.id && (
                  <ChoreManagePanel
                    familyChores={chores.familyChores}
                    members={members}
                    selfId={user.id}
                    onLoad={chores.loadFamilyChores}
                    createChore={chores.createChore}
                    updateChore={chores.updateChore}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}

      {!family && !chores.loading && (
        <p className="text-sm text-ink-3">
          Chores are shared with your family. Set one up on the Family page first.
        </p>
      )}
    </main>
  );
}
