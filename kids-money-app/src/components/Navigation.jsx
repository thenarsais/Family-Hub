import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ userAge }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isYoung = userAge < 8;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          {isYoung ? '💰 Money World' : '📊 Stock Trader'}
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🏠 Home' : 'Dashboard'}
          </Link>
          <Link to="/trading" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '📈 Trade' : 'Trading'}
          </Link>
          <Link to="/portfolio" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🎒 My Stocks' : 'Portfolio'}
          </Link>
          <Link to="/lessons" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🎓 Learn' : 'Lessons'}
          </Link>
          <Link to="/credit-score" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '⭐ Score' : 'Credit Score'}
          </Link>
          <Link to="/budget" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '💰 Budget' : 'Budget'}
          </Link>
          <Link to="/calculator" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🧮 Calc' : 'Calculator'}
          </Link>
          <Link to="/quiz" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🎯 Quiz' : 'Quiz'}
          </Link>
          <Link to="/tutorials" className="nav-link nav-link--highlight" onClick={() => setIsMenuOpen(false)}>
            {isYoung ? '🎓 Learn' : 'Tutorials'}
          </Link>
        </div>

        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
