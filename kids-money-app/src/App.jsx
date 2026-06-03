import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Lessons from './pages/Lessons';
import Portfolio from './pages/Portfolio';
import CreditScore from './pages/CreditScore';
import Budget from './pages/Budget';
import Calculator from './pages/Calculator';
import Quiz from './pages/Quiz';
import { PortfolioProvider } from './context/PortfolioContext';
import { BudgetProvider } from './context/BudgetContext';
import './App.css';

function App() {
  const [userAge, setUserAge] = useState(localStorage.getItem('userAge') || 8);
  const [theme, setTheme] = useState('kid-friendly');

  useEffect(() => {
    // Apply age-appropriate styling
    document.documentElement.setAttribute('data-age', userAge);
  }, [userAge]);

  return (
    <PortfolioProvider>
      <BudgetProvider>
      <Router>
        <div className="app">
          <Navigation userAge={userAge} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard userAge={userAge} />} />
              <Route path="/trading" element={<Trading userAge={userAge} />} />
              <Route path="/lessons" element={<Lessons userAge={userAge} />} />
              <Route path="/portfolio" element={<Portfolio userAge={userAge} />} />
              <Route path="/credit-score" element={<CreditScore userAge={userAge} />} />
              <Route path="/budget" element={<Budget userAge={userAge} />} />
              <Route path="/calculator" element={<Calculator userAge={userAge} />} />
              <Route path="/quiz" element={<Quiz userAge={userAge} />} />
            </Routes>
          </main>
        </div>
      </Router>
      </BudgetProvider>
    </PortfolioProvider>
  );
}

export default App;
