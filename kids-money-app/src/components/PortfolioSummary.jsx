import React from 'react';
import '../styles/PortfolioSummary.css';

function PortfolioSummary({ portfolioValue, gain, gainPercent, cashAvailable, userAge }) {
  const isYoung = userAge < 8;
  const isPositive = gain >= 0;

  return (
    <div className="portfolio-summary">
      <div className={`summary-card main ${isYoung ? 'large-text' : ''}`}>
        <h2>{isYoung ? '💼 Your Wealth' : 'Portfolio Value'}</h2>
        <p className="big-number">${portfolioValue.toFixed(2)}</p>
        <p className={`gain ${isPositive ? 'gain-positive' : 'gain-negative'}`}>
          {isPositive ? '📈 +' : '📉 '} ${Math.abs(gain).toFixed(2)} ({gainPercent}%)
        </p>
      </div>

      <div className={`summary-card ${isYoung ? 'large-text' : ''}`}>
        <h3>{isYoung ? '💵 Cash' : 'Available Cash'}</h3>
        <p className="number">${cashAvailable.toFixed(2)}</p>
      </div>
    </div>
  );
}

export default PortfolioSummary;
