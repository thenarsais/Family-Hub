import React from 'react';
import { useTutorial } from '../context/TutorialContext';
import { TOURS } from '../data/tours';
import { SCENARIOS } from '../data/scenarios';
import '../styles/Tutorials.css';

const DIFFICULTY_COLOR = { Easy: '#4caf50', Medium: '#f0a500', Hard: '#f44336' };

function Tutorials({ userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const {
    onboardingComplete, resetOnboarding,
    completedTours, completedScenarios,
    startTour, startScenario,
  } = useTutorial();

  const availableScenarios = SCENARIOS.filter(s => userAge >= s.ageMin && userAge <= s.ageMax);

  return (
    <div className="tutorials-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '🎓 Learn & Play!' : isTeen ? 'Tutorials & Scenarios' : '🎓 Guided Tutorials'}
      </h1>

      {/* ── Onboarding ─────────────────────────────────────────── */}
      <section className="tut-section">
        <h2>{isYoung ? '👋 Getting Started' : 'Getting Started'}</h2>
        <p className="tut-subtitle">
          {isYoung
            ? 'A friendly tour of Money World just for you!'
            : 'A 5-slide welcome tour tailored to your age group.'}
        </p>
        <div className="onboard-replay-card">
          <div className="onboard-replay-left">
            <span className="onboard-replay-icon">{isYoung ? '🌟' : '🚀'}</span>
            <div>
              <h3>
                {isYoung ? 'Welcome Tour (Ages 5–7)'
                  : isTeen ? 'Welcome Tour (Ages 13+)'
                  : 'Welcome Tour (Ages 8–12)'}
              </h3>
              <p>
                {isYoung ? 'Big pictures, simple words, and your first money mission!'
                  : isTeen ? 'Financial mechanics, credit score math, and scenario overview.'
                  : 'All features explained at the right level — stocks, budget, credit.'}
              </p>
              {onboardingComplete && <span className="done-pill">✓ Completed</span>}
            </div>
          </div>
          <button
            className="btn-tut-action"
            onClick={resetOnboarding}
          >
            {onboardingComplete ? '↺ Replay' : '▶ Start'}
          </button>
        </div>
      </section>

      {/* ── Feature Tours ──────────────────────────────────────── */}
      <section className="tut-section">
        <h2>{isYoung ? '🗺️ App Tours' : 'Feature Tours'}</h2>
        <p className="tut-subtitle">
          {isYoung
            ? 'Let me show you around each part of the app!'
            : 'Step-by-step walkthroughs of the three main features. Each auto-navigates to the right page.'}
        </p>
        <div className="tours-grid">
          {Object.values(TOURS).map(tour => {
            const done = completedTours.includes(tour.id);
            return (
              <div key={tour.id} className={`tour-card ${done ? 'tour-card--done' : ''}`}>
                <div className="tour-card-top">
                  <span className="tour-card-icon">{tour.icon}</span>
                  {done && <span className="done-pill">✓ Done</span>}
                </div>
                <h3 className="tour-card-title">{tour.title}</h3>
                <p className="tour-card-desc">{tour.description}</p>
                <p className="tour-card-meta">{tour.steps.length} steps</p>
                <button className="btn-tut-action btn-tut-full" onClick={() => startTour(tour.id)}>
                  {done ? '↺ Retake Tour' : '▶ Start Tour'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Scenarios ──────────────────────────────────────────── */}
      <section className="tut-section">
        <h2>{isYoung ? '🌟 Learning Adventures' : 'Learning Scenarios'}</h2>
        <p className="tut-subtitle">
          {isYoung
            ? 'Fun money adventures — follow the steps and learn by doing!'
            : 'Realistic financial scenarios with guided step-by-step instructions and real-world lessons.'}
        </p>

        {availableScenarios.length === 0 && (
          <div className="empty-state">
            <p>No scenarios available for your age group yet. Check back soon!</p>
          </div>
        )}

        <div className="scenarios-grid">
          {availableScenarios.map(scenario => {
            const done = completedScenarios.includes(scenario.id);
            return (
              <div key={scenario.id} className={`scenario-card ${done ? 'scenario-card--done' : ''}`}>
                <div className="scenario-card-header">
                  <span className="scenario-card-icon">{scenario.icon}</span>
                  <div className="scenario-card-meta">
                    <span
                      className="scenario-difficulty"
                      style={{ color: DIFFICULTY_COLOR[scenario.difficulty] }}
                    >
                      {scenario.difficulty}
                    </span>
                    <span className="scenario-sep">·</span>
                    <span className="scenario-duration">{scenario.duration}</span>
                    <span className="scenario-sep">·</span>
                    <span className="scenario-steps-count">{scenario.steps.length} steps</span>
                  </div>
                </div>
                <h3 className="scenario-card-title">{scenario.title}</h3>
                <p className="scenario-card-desc">{scenario.description}</p>
                <div className="scenario-goal-box">
                  <strong>Goal:</strong> {scenario.goal}
                </div>
                {done && <span className="done-pill scenario-done-pill">✓ Completed</span>}
                <button className="btn-tut-action btn-tut-full" onClick={() => startScenario(scenario.id)}>
                  {done ? '↺ Redo Scenario' : (isYoung ? '▶ Start Adventure!' : '▶ Begin Scenario')}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Tutorials;
