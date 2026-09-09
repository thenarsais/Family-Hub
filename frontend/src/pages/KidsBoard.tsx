import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFamily } from '@hooks/useFamily';
import { useKidBoard } from '@hooks/useKidBoard';
import { colorForIndex } from '@/data/familyColors';
import { EXPLORE_CATEGORIES } from '@/data/exploreCategories';
import RoutineChecklist from '@components/kids/RoutineChecklist';
import KidMoodTap from '@components/kids/KidMoodTap';
import CategoryExplorer from '@components/kids/CategoryExplorer';
import RoutineManagePanel from '@components/kids/RoutineManagePanel';

function Spinner() {
  return (
    <div className="py-10 flex justify-center" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
    </div>
  );
}

/**
 * Karishma's Activity Board (T-12 / FR-047) — a parent opens `/kids/:memberId`
 * from the Family page and taps on the child's behalf. Deliberately simple:
 * big icons, no points, no streaks, no collapsible-section shell.
 */
export default function KidsBoard() {
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const { members, loading: familyLoading } = useFamily();

  const child = members.find((m) => m.user_id === memberId);
  const childIndex = members.findIndex((m) => m.user_id === memberId);
  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;

  const board = useKidBoard(memberId);
  const [managing, setManaging] = useState(false);

  const { refreshManage } = board;
  useEffect(() => {
    if (managing) void refreshManage();
  }, [managing, refreshManage]);

  if (familyLoading) {
    return (
      <main className="container py-8">
        <Spinner />
      </main>
    );
  }

  if (!canManage || !child) {
    return (
      <main className="container py-10 text-center space-y-3">
        <p className="text-ink-2">This is a grown-up view for a child's day.</p>
        <Link to="/dashboard" className="btn btn-secondary btn-small">
          Back to the dashboard
        </Link>
      </main>
    );
  }

  const name = child.name || 'this child';
  const dot = colorForIndex(childIndex < 0 ? 0 : childIndex);
  const morning = board.routines.filter((r) => r.slot === 'morning');
  const evening = board.routines.filter((r) => r.slot === 'evening');

  return (
    <main className="container py-6 space-y-8 max-w-2xl">
      <header className="flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full shrink-0"
          style={{ backgroundColor: dot.hex }}
          aria-hidden="true"
        />
        <h1 className="font-display text-3xl font-bold text-ink flex-1">{name}'s day</h1>
        <button
          type="button"
          className="btn btn-secondary btn-small gap-1"
          onClick={() => setManaging((v) => !v)}
          aria-pressed={managing}
        >
          <Settings2 className="h-3.5 w-3.5" />
          {managing ? 'Done' : 'Manage'}
        </button>
      </header>

      {board.error && (
        <p className="text-sm text-alert bg-alert/10 rounded p-3">{board.error}</p>
      )}

      {board.loading ? (
        <Spinner />
      ) : (
        <>
          <RoutineChecklist
            title="Morning"
            emoji="🌅"
            routines={morning}
            onToggle={(id, done) => (done ? board.completeRoutine(id) : board.undoRoutine(id))}
          />
          <RoutineChecklist
            title="Evening"
            emoji="🌙"
            routines={evening}
            onToggle={(id, done) => (done ? board.completeRoutine(id) : board.undoRoutine(id))}
          />
          <KidMoodTap todayMood={board.todayMood} onPick={board.setMood} />
          <CategoryExplorer categories={EXPLORE_CATEGORIES} />

          {managing && (
            <RoutineManagePanel
              routines={board.manageRoutines}
              onCreate={board.createRoutine}
              onUpdate={board.updateRoutine}
            />
          )}
        </>
      )}
    </main>
  );
}
