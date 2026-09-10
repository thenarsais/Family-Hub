import { useState } from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useFamily } from '@hooks/useFamily';
import { useChores } from '@hooks/useChores';
import { useHabits } from '@hooks/useHabits';
import { useHomework } from '@hooks/useHomework';
import { useBoardSections } from '@hooks/useBoardSections';
import ChoresSection from '@components/activity/ChoresSection';
import ChoreManagePanel from '@components/activity/ChoreManagePanel';
import HabitsSection from '@components/activity/HabitsSection';
import HabitManagePanel from '@components/activity/HabitManagePanel';
import HomeworkSection from '@components/activity/HomeworkSection';
import HomeworkManagePanel from '@components/activity/HomeworkManagePanel';
import MoodCheckIn from '@components/activity/MoodCheckIn';
import LearningSummarySection from '@components/activity/LearningSummarySection';
import TriviaSection from '@components/activity/TriviaSection';

/** Board sections in their default order. The shell (order + collapse per
 *  profile) is generic — Games / Reading slot in the same way. */
const SECTIONS = [
  { id: 'chores', title: 'Chores today', emoji: '🧹', manageable: true },
  { id: 'habits', title: 'Habits this week', emoji: '🎯', manageable: true },
  { id: 'homework', title: 'Homework', emoji: '📚', manageable: true },
  { id: 'mood', title: 'Mood', emoji: '💛', manageable: false },
  { id: 'trivia', title: 'Trivia', emoji: '🧠', manageable: false },
  { id: 'gujarati', title: 'Gujarati', emoji: '📖', manageable: false },
];
const SECTION_IDS = SECTIONS.map((s) => s.id);

function Spinner() {
  return (
    <div className="py-6 flex justify-center" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
    </div>
  );
}

export default function ActivityBoard() {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const chores = useChores();
  const habits = useHabits();
  const homework = useHomework();

  const caller = members.find((m) => m.user_id === user?.id);
  const canManage = caller ? ['admin', 'parent'].includes(caller.role) : false;

  const profileKey = user?.id || 'anon';
  const { sorted, collapsed, move, toggle } = useBoardSections(profileKey, SECTION_IDS);

  const [managingId, setManagingId] = useState<string | null>(null);

  return (
    <main className="container py-6 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink">Activity Board</h1>
        <p className="text-ink-2 text-sm mt-1">
          Tap something when it's done to earn its points. The day resets overnight.
        </p>
      </header>

      {(chores.error || habits.error || homework.error) && (
        <p className="text-sm text-alert bg-alert/10 rounded p-3">
          {chores.error || habits.error || homework.error}
        </p>
      )}

      {sorted.map((id, i) => {
        const meta = SECTIONS.find((s) => s.id === id);
        if (!meta) return null;
        const isCollapsed = collapsed[id];
        const managing = managingId === id;
        return (
          <section key={id} className="card">
            <div className="flex items-center gap-2">
              <button
                className="flex flex-1 items-center gap-2 text-left"
                onClick={() => toggle(id)}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${meta.title}`}
              >
                <span className="text-lg" aria-hidden="true">{meta.emoji}</span>
                <h2 className="font-display text-lg font-bold text-ink">{meta.title}</h2>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-ink-3" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-ink-3" />
                )}
              </button>

              {meta.manageable && canManage && !isCollapsed && (
                <button
                  className="btn btn-secondary btn-small gap-1"
                  onClick={() => setManagingId((cur) => (cur === id ? null : id))}
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

            {!isCollapsed && (
              <div className="mt-4">
                {id === 'chores' && (
                  <>
                    {chores.loading ? (
                      <Spinner />
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
                  </>
                )}

                {id === 'habits' && (
                  <>
                    {habits.loading ? (
                      <Spinner />
                    ) : (
                      <HabitsSection
                        habits={habits.habits}
                        onComplete={habits.complete}
                        onUndo={habits.undo}
                      />
                    )}
                    {managing && canManage && user?.id && (
                      <HabitManagePanel
                        familyHabits={habits.familyHabits}
                        members={members}
                        selfId={user.id}
                        onLoad={habits.loadFamilyHabits}
                        createHabit={habits.createHabit}
                        updateHabit={habits.updateHabit}
                      />
                    )}
                  </>
                )}

                {id === 'homework' && (
                  <>
                    {homework.loading ? (
                      <Spinner />
                    ) : (
                      <HomeworkSection
                        items={homework.items}
                        onComplete={homework.complete}
                        onUncomplete={homework.uncomplete}
                        onAdd={homework.createItem}
                      />
                    )}
                    {managing && canManage && user?.id && (
                      <HomeworkManagePanel
                        familyItems={homework.familyItems}
                        members={members}
                        selfId={user.id}
                        onLoad={homework.loadFamilyItems}
                        createItem={homework.createItem}
                        updateItem={homework.updateItem}
                        deleteItem={homework.deleteItem}
                      />
                    )}
                  </>
                )}

                {id === 'mood' &&
                  (habits.loading ? (
                    <Spinner />
                  ) : (
                    <MoodCheckIn todayMood={habits.todayMood} onPick={habits.setMood} />
                  ))}

                {id === 'trivia' && <TriviaSection />}

                {id === 'gujarati' && <LearningSummarySection />}
              </div>
            )}
          </section>
        );
      })}

      {!family && !chores.loading && (
        <p className="text-sm text-ink-3">
          The board is shared with your family. Set one up on the Family page first.
        </p>
      )}
    </main>
  );
}
