import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Trading from './pages/Trading';
import Lessons from './pages/Lessons';
import Portfolio from './pages/Portfolio';
import { PortfolioProvider } from './context/PortfolioContext';
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
      <Router>
        <div className="app">
          <Navigation userAge={userAge} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard userAge={userAge} />} />
              <Route path="/trading" element={<Trading userAge={userAge} />} />
              <Route path="/lessons" element={<Lessons userAge={userAge} />} />
              <Route path="/portfolio" element={<Portfolio userAge={userAge} />} />
            </Routes>
          </main>
        </div>
      </Router>
    </PortfolioProvider>
  );
}

export default App;
