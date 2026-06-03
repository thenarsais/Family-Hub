import React, { createContext, useContext, useState, useEffect } from 'react';

const TutorialContext = createContext();

export function TutorialProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('tutorials');
    return saved ? JSON.parse(saved) : {
      onboardingComplete: false,
      completedTours: [],
      completedScenarios: [],
      activeTour: null,
      activeScenario: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('tutorials', JSON.stringify(state));
  }, [state]);

  const completeOnboarding = () => setState(s => ({ ...s, onboardingComplete: true }));
  const resetOnboarding = () => setState(s => ({ ...s, onboardingComplete: false }));

  const startTour = id => setState(s => ({ ...s, activeTour: { id, step: 0 }, activeScenario: null }));
  const advanceTour = () => setState(s => s.activeTour
    ? { ...s, activeTour: { ...s.activeTour, step: s.activeTour.step + 1 } }
    : s);
  const completeTour = id => setState(s => ({
    ...s,
    activeTour: null,
    completedTours: s.completedTours.includes(id) ? s.completedTours : [...s.completedTours, id],
  }));
  const dismissTour = () => setState(s => ({ ...s, activeTour: null }));

  const startScenario = id => setState(s => ({ ...s, activeScenario: { id, step: 0 }, activeTour: null }));
  const advanceScenario = () => setState(s => s.activeScenario
    ? { ...s, activeScenario: { ...s.activeScenario, step: s.activeScenario.step + 1 } }
    : s);
  const completeScenario = id => setState(s => ({
    ...s,
    activeScenario: null,
    completedScenarios: s.completedScenarios.includes(id) ? s.completedScenarios : [...s.completedScenarios, id],
  }));
  const dismissScenario = () => setState(s => ({ ...s, activeScenario: null }));

  return (
    <TutorialContext.Provider value={{
      ...state,
      completeOnboarding, resetOnboarding,
      startTour, advanceTour, completeTour, dismissTour,
      startScenario, advanceScenario, completeScenario, dismissScenario,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorial must be used within TutorialProvider');
  return ctx;
}
