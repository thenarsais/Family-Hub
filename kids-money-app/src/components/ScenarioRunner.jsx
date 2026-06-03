import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../context/TutorialContext';
import { SCENARIOS } from '../data/scenarios';
import '../styles/Tutorial.css';

function ScenarioRunner() {
  const navigate = useNavigate();
  const { activeScenario, advanceScenario, completeScenario, dismissScenario } = useTutorial();

  const scenario = activeScenario ? SCENARIOS.find(s => s.id === activeScenario.id) : null;
  const isComplete = scenario ? activeScenario.step >= scenario.steps.length : false;
  const step = scenario && !isComplete ? scenario.steps[activeScenario.step] : null;
  const isLastStep = scenario ? activeScenario.step === scenario.steps.length - 1 : false;

  useEffect(() => {
    if (step?.action?.type === 'navigate') navigate(step.action.path);
  }, [activeScenario?.step, activeScenario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeScenario || !scenario) return null;

  if (isComplete) {
    return (
      <div className="floating-panel scenario-panel scenario-panel--complete">
        <div className="panel-header">
          <span className="panel-badge">{scenario.icon} {scenario.title}</span>
          <button className="panel-close" onClick={() => completeScenario(scenario.id)} aria-label="Close">✕</button>
        </div>
        <div className="panel-body scenario-complete-body">
          <div className="scenario-complete-icon">🎉</div>
          <h3 className="scenario-complete-title">{scenario.completion.title}</h3>
          <p className="panel-step-text">{scenario.completion.message}</p>
          <div className="panel-tip scenario-lesson">
            <strong>Key Lesson:</strong> {scenario.completion.lesson}
          </div>
        </div>
        <div className="panel-footer">
          <button className="btn-panel-done" onClick={() => completeScenario(scenario.id)}>
            Mark Complete ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="floating-panel scenario-panel">
      <div className="panel-header">
        <span className="panel-badge">{scenario.icon} {scenario.title}</span>
        <span className="panel-step-count">Step {activeScenario.step + 1} / {scenario.steps.length}</span>
        <button className="panel-close" onClick={dismissScenario} aria-label="Exit scenario">✕</button>
      </div>

      <div className="panel-body">
        <h3 className="panel-step-title">{step.title}</h3>
        <p className="panel-step-text">{step.instruction}</p>
        {step.tip && <div className="panel-tip">{step.tip}</div>}
      </div>

      <div className="panel-footer">
        <div className="panel-dots">
          {scenario.steps.map((_, i) => (
            <div key={i} className={`pdot ${i === activeScenario.step ? 'active' : i < activeScenario.step ? 'done' : ''}`} />
          ))}
        </div>
        <button className="btn-panel-next" onClick={advanceScenario}>
          {isLastStep ? 'Complete →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default ScenarioRunner;
