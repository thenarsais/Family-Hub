import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../context/TutorialContext';
import { QUESTIONS, SKILL_RECOMMENDATIONS } from '../data/quizzes';
import '../styles/QuizWidget.css';

function ageKey(userAge) {
  if (userAge < 8)  return 'young';
  if (userAge < 13) return 'intermediate';
  return 'teen';
}

/**
 * Compact inline quiz — picks 3 questions from the given category.
 * Shows collapsed by default; expands on click.
 *
 * Props:
 *   categoryId  – one of: trading | budget | credit | savings | markets
 *   userAge     – number
 *   title       – optional heading override
 *   startIndex  – optional offset into the question bank (0-based), so
 *                 different widgets on the same page don't repeat the same Qs
 */
function QuizWidget({ categoryId, userAge, title, startIndex = 0 }) {
  const isYoung = userAge < 8;
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();
  const { startTour, startScenario } = useTutorial();

  const allQs = QUESTIONS[categoryId]?.[ageKey(userAge)] || [];
  // Slice 3 questions starting at startIndex (wraps around)
  const questions = useMemo(() => {
    if (!allQs.length) return [];
    const total = allQs.length;
    return [0, 1, 2].map(i => allQs[(startIndex + i) % total]);
  }, [categoryId, userAge, startIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const recs = SKILL_RECOMMENDATIONS[categoryId];
  const q = questions[current];

  function handleSelect(idx) {
    if (selected !== null || !q) return;
    setSelected(idx);
    if (idx === q.answer) setScore(s => s + 1);
  }

  function handleNext() {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); }
    else setDone(true);
  }

  function handleRestart() {
    setCurrent(0); setSelected(null); setScore(0); setDone(false);
  }

  function handleRec(rec) {
    if (rec.tourId)          { startTour(rec.tourId);          navigate('/tutorials'); }
    else if (rec.scenarioId) { startScenario(rec.scenarioId);  navigate('/tutorials'); }
    else                     { navigate(rec.path); }
  }

  if (!questions.length) return null;

  const pct = Math.round((score / questions.length) * 100);
  const needsRec = done && pct < 75;

  return (
    <div className={`quiz-widget ${open ? 'quiz-widget--open' : ''}`}>
      {/* Collapsed trigger */}
      <button className="quiz-widget-trigger" onClick={() => setOpen(o => !o)}>
        <span className="widget-trigger-left">
          <span className="widget-icon">🎯</span>
          <span className="widget-title">{title || 'Check Your Understanding'}</span>
          {done && (
            <span className={`widget-badge ${pct >= 75 ? 'badge--pass' : 'badge--review'}`}>
              {score}/{questions.length}
            </span>
          )}
        </span>
        <span className="widget-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="quiz-widget-body">
          {!done ? (
            <>
              <div className="widget-progress">
                <div className="widget-progress-bar">
                  <div className="widget-progress-fill" style={{ width: `${(current / questions.length) * 100}%` }} />
                </div>
                <span className="widget-step">{current + 1}/{questions.length}</span>
              </div>

              <p className={`widget-question ${isYoung ? 'text-xl' : ''}`}>{q.q}</p>

              <div className="widget-options">
                {q.options.map((opt, i) => {
                  let cls = 'widget-option';
                  if (selected !== null) {
                    if (i === q.answer)                         cls += ' correct';
                    else if (i === selected && i !== q.answer) cls += ' wrong';
                    else                                        cls += ' dimmed';
                  }
                  return (
                    <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
                      <span className="widget-opt-letter">{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className={`widget-explanation ${selected === q.answer ? 'correct-box' : 'wrong-box'}`}>
                  <strong>{selected === q.answer ? '✅' : '❌'}</strong> {q.explanation}
                </div>
              )}

              {selected !== null && (
                <button className="widget-next-btn" onClick={handleNext}>
                  {current < questions.length - 1 ? 'Next →' : 'See Result →'}
                </button>
              )}
            </>
          ) : (
            <div className="widget-result">
              <div className={`widget-score-badge ${pct >= 75 ? 'pass' : 'review'}`}>
                {score}/{questions.length} · {pct}%
              </div>
              <p className="widget-score-msg">
                {pct >= 75
                  ? (isYoung ? '🌟 You got it! Great job!' : 'Well done — you\'ve got this concept down.')
                  : (isYoung ? '💪 Almost! Try again or check the lessons.' : 'Review the resources below to strengthen this area.')}
              </p>

              {needsRec && recs && (
                <div className="widget-recs">
                  <p className="widget-rec-heading">
                    {isYoung ? 'Try these:' : 'Recommended next steps:'}
                  </p>
                  {Object.values(recs).slice(0, 3).map((rec, i) => (
                    <button key={i} className="widget-rec-btn" onClick={() => handleRec(rec)}>
                      {rec.label} →
                    </button>
                  ))}
                </div>
              )}

              <button className="widget-retry-btn" onClick={handleRestart}>
                {isYoung ? '🔄 Try Again' : 'Retry'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuizWidget;
