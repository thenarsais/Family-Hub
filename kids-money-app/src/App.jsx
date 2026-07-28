import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import OnboardingFlow from './components/OnboardingFlow';
import GuidedTour from './components/GuidedTour';
import ScenarioRunner from './components/ScenarioRunner';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Lessons from './pages/Lessons';
import Portfolio from './pages/Portfolio';
import CreditScore from './pages/CreditScore';
import Budget from './pages/Budget';
import Calculator from './pages/Calculator';
import Quiz from './pages/Quiz';
import Tutorials from './pages/Tutorials';
import { PortfolioProvider } from './context/PortfolioContext';
import { BudgetProvider } from './context/BudgetContext';
import { TutorialProvider, useTutorial } from './context/TutorialContext';
import './App.css';

function AppInner({ userAge }) {
  const { activeTour, activeScenario } = useTutorial();
  const hasPanel = !!(activeTour || activeScenario);

  return (
    <div className={`app ${hasPanel ? 'has-panel' : ''}`}>
      <Navigation userAge={userAge} />
      <OnboardingFlow userAge={userAge} />
      <GuidedTour />
      <ScenarioRunner />
      <main className="main-content">
        <Routes>
          <Route path="/"              element={<Dashboard   userAge={userAge} />} />
          <Route path="/trading"       element={<Trading     userAge={userAge} />} />
          <Route path="/lessons"       element={<Lessons     userAge={userAge} />} />
          <Route path="/portfolio"     element={<Portfolio   userAge={userAge} />} />
          <Route path="/credit-score"  element={<CreditScore userAge={userAge} />} />
          <Route path="/budget"        element={<Budget      userAge={userAge} />} />
          <Route path="/calculator"    element={<Calculator  userAge={userAge} />} />
          <Route path="/quiz"          element={<Quiz        userAge={userAge} />} />
          <Route path="/tutorials"     element={<Tutorials   userAge={userAge} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [userAge, setUserAge] = useState(localStorage.getItem('userAge') || 8); // eslint-disable-line no-unused-vars

  useEffect(() => {
    document.documentElement.setAttribute('data-age', userAge);
  }, [userAge]);

  return (
    <PortfolioProvider>
      <BudgetProvider>
        <TutorialProvider>
          <Router>
            <AppInner userAge={userAge} />
          </Router>
        </TutorialProvider>
      </BudgetProvider>
    </PortfolioProvider>
  );
}

export default App;
