import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTutorial } from '../context/TutorialContext';
import { TOURS } from '../data/tours';
import '../styles/Tutorial.css';

function GuidedTour() {
  const navigate = useNavigate();
  const { activeTour, advanceTour, completeTour, dismissTour } = useTutorial();

  const tour = activeTour ? TOURS[activeTour.id] : null;
  const step = tour ? tour.steps[activeTour.step] : null;
  const isLast = tour ? activeTour.step === tour.steps.length - 1 : false;

  useEffect(() => {
    if (step?.page) navigate(step.page);
  }, [activeTour?.step, activeTour?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeTour || !tour || !step) return null;

  const handleNext = () => {
    if (isLast) completeTour(tour.id);
    else advanceTour();
  };

  return (
    <div className="floating-panel tour-panel">
      <div className="panel-header">
        <span className="panel-badge">{tour.icon} {tour.title}</span>
        <span className="panel-step-count">{activeTour.step + 1} / {tour.steps.length}</span>
        <button className="panel-close" onClick={dismissTour} aria-label="Close tour">✕</button>
      </div>

      <div className="panel-body">
        <h3 className="panel-step-title">{step.title}</h3>
        <p className="panel-step-text">{step.instruction}</p>
        {step.tip && <div className="panel-tip">{step.tip}</div>}
      </div>

      <div className="panel-footer">
        <div className="panel-dots">
          {tour.steps.map((_, i) => (
            <div key={i} className={`pdot ${i === activeTour.step ? 'active' : i < activeTour.step ? 'done' : ''}`} />
          ))}
        </div>
        <button className="btn-panel-next" onClick={handleNext}>
          {isLast ? 'Finish ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default GuidedTour;
