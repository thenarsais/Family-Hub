import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import '../styles/QuickStats.css';

function QuickStats({ userAge }) {
  const { portfolio, stocks } = usePortfolio();
  const isYoung = userAge < 8;

  const holdingsCount = Object.values(portfolio.holdings).reduce((sum, qty) => sum + qty, 0);
  const uniqueStocks = Object.keys(portfolio.holdings).length;

  return (
    <div className="quick-stats">
      <h2>{isYoung ? '📊 Stats' : 'Quick Stats'}</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">{isYoung ? '📦 Total Shares' : 'Shares Owned'}</span>
          <span className="stat-value">{holdingsCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{isYoung ? '🏢 Companies' : 'Different Stocks'}</span>
          <span className="stat-value">{uniqueStocks}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{isYoung ? '💰 Started With' : 'Initial Cash'}</span>
          <span className="stat-value">$10,000</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">{isYoung ? '📝 Trades' : 'Transactions'}</span>
          <span className="stat-value">{portfolio.transactions.length}</span>
        </div>
      </div>
    </div>
  );
}

export default QuickStats;
