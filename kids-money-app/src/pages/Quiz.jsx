import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../context/TutorialContext';
import { QUIZ_CATEGORIES, QUESTIONS, SKILL_RECOMMENDATIONS } from '../data/quizzes';
import '../styles/Quiz.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ageKey(userAge) {
  if (userAge < 8)  return 'young';
  if (userAge < 13) return 'intermediate';
  return 'teen';
}

function scoreLabel(pct, isYoung) {
  if (pct >= 80) return isYoung ? '🌟 Amazing! You\'re a money star!'    : '🌟 Excellent — you really know this topic!';
  if (pct >= 60) return isYoung ? '😊 Good job! Keep practising!'        : '👍 Good effort — review the explanations and try again.';
  return              isYoung ? '💪 Keep trying — you\'ll get it!'      : 'Let\'s revisit this topic — see the resources below.';
}

// ── Recommendation pill ───────────────────────────────────────────────────────

function RecPill({ rec, onAction }) {
  return (
    <button className="rec-pill" onClick={() => onAction(rec)}>
      {rec.label} →
    </button>
  );
}

// ── Score screen ──────────────────────────────────────────────────────────────

function ScoreScreen({ category, score, total, userAge, onRetake, onHub }) {
  const isYoung = userAge < 8;
  const pct = Math.round((score / total) * 100);
  const needsReview = pct < 75;
  const recs = SKILL_RECOMMENDATIONS[category];
  const navigate = useNavigate();
  const { startTour, startScenario } = useTutorial();

  function handleRec(rec) {
    if (rec.tourId)     { startTour(rec.tourId);         navigate('/tutorials'); }
    else if (rec.scenarioId) { startScenario(rec.scenarioId); navigate('/tutorials'); }
    else                { navigate(rec.path); }
  }

  return (
    <div className="quiz-result-card">
      <div className="quiz-score-circle">
        <span className="quiz-score-num">{score}/{total}</span>
        <span className="quiz-score-pct">{pct}%</span>
      </div>
      <p className="quiz-grade">{scoreLabel(pct, isYoung)}</p>

      {needsReview && recs && (
        <div className="skill-gap-section">
          <p className="skill-gap-heading">
            {isYoung ? '📚 Try these to learn more:' : 'Strengthen this skill:'}
          </p>
          <div className="rec-pills">
            {Object.values(recs).map((rec, i) => (
              <RecPill key={i} rec={rec} onAction={handleRec} />
            ))}
          </div>
        </div>
      )}

      <div className="score-actions">
        <button className="btn-restart" onClick={onRetake}>
          {isYoung ? '🔄 Try Again!' : 'Retake Quiz'}
        </button>
        <button className="btn-hub" onClick={onHub}>
          ← All Quizzes
        </button>
      </div>
    </div>
  );
}

// ── Quiz runner ───────────────────────────────────────────────────────────────

function QuizRunner({ categoryId, userAge, onDone, onBack }) {
  const isYoung = userAge < 8;
  const questions = QUESTIONS[categoryId]?.[ageKey(userAge)] || [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!questions.length) {
    return (
      <div className="empty-state">
        <p>No questions available for this age group yet.</p>
        <button className="btn-hub" onClick={onBack}>← Back</button>
      </div>
    );
  }

  const q = questions[current];
  const answered = selected !== null;
  const isLastQ = current === questions.length - 1;

  function handleSelect(idx) {
    if (answered) return;
    setSelected(idx);
    if (idx === q.answer) setScore(s => s + 1);
  }

  function handleNext() {
    if (isLastQ) { setFinished(true); }
    else         { setCurrent(c => c + 1); setSelected(null); }
  }

  if (finished) {
    return (
      <ScoreScreen
        category={categoryId}
        score={score}
        total={questions.length}
        userAge={userAge}
        onRetake={() => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); }}
        onHub={onBack}
      />
    );
  }

  return (
    <>
      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(current / questions.length) * 100}%` }} />
        </div>
        <span className="quiz-progress-label">{current + 1} / {questions.length}</span>
        <button className="btn-hub-small" onClick={onBack}>← Hub</button>
      </div>

      <div className="question-card">
        <p className={`question-text ${isYoung ? 'text-2xl' : ''}`}>{q.q}</p>

        <div className="options-list">
          {q.options.map((opt, i) => {
            let cls = 'option-btn';
            if (answered) {
              if (i === q.answer)                         cls += ' correct';
              else if (i === selected && i !== q.answer) cls += ' wrong';
              else                                        cls += ' dimmed';
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={answered}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={`explanation-box ${selected === q.answer ? 'correct-box' : 'wrong-box'}`}>
            <p>
              <strong>{selected === q.answer ? '✅ Correct!' : '❌ Not quite.'}</strong>{' '}
              {q.explanation}
            </p>
          </div>
        )}

        {answered && (
          <button className="btn-next" onClick={handleNext}>
            {isLastQ
              ? (isYoung ? '🏁 See My Score!' : 'See Results')
              : (isYoung ? 'Next Question →' : 'Next →')}
          </button>
        )}
      </div>

      <div className="quiz-score-tracker">
        {isYoung ? `⭐ Score: ${score}` : `Score: ${score} / ${current + (answered ? 1 : 0)}`}
      </div>
    </>
  );
}

// ── Category hub ──────────────────────────────────────────────────────────────

function CategoryHub({ userAge, onSelect }) {
  const isYoung = userAge < 8;
  const isTeen  = userAge >= 13;

  const qCount = cat => (QUESTIONS[cat]?.[ageKey(userAge)] || []).length;

  return (
    <>
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '🎯 Money Quizzes!' : isTeen ? 'Knowledge Quizzes' : '💡 Quiz Hub'}
      </h1>
      <p className="quiz-hub-subtitle">
        {isYoung
          ? 'Pick a topic and test what you know!'
          : 'Pick a topic. If your score is below 75%, we\'ll point you straight to the right resource.'}
      </p>

      <div className="quiz-category-grid">
        {QUIZ_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className="quiz-category-card"
            style={{ '--cat-color': cat.color }}
            onClick={() => onSelect(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-label">{cat.label}</span>
            <span className="cat-count">{qCount(cat.id)} questions</span>
          </button>
        ))}
      </div>

      {!isYoung && (
        <div className="quiz-hub-tip">
          <strong>How it works:</strong> Each quiz tests a different financial skill area.
          Score ≥ 75% = you\'ve got it. Score &lt; 75% = we show you exactly which tutorial,
          scenario, or page to revisit. No wrong answers — just direction.
        </div>
      )}
    </>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

function Quiz({ userAge }) {
  const [activeCategory, setActiveCategory] = useState(null);

  if (activeCategory) {
    return (
      <div className="quiz-page">
        <QuizRunner
          categoryId={activeCategory}
          userAge={userAge}
          onBack={() => setActiveCategory(null)}
        />
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <CategoryHub userAge={userAge} onSelect={setActiveCategory} />
    </div>
  );
}

export default Quiz;
