import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import PortfolioSummary from '../components/PortfolioSummary';
import QuickStats from '../components/QuickStats';

function Dashboard({ userAge }) {
  const { portfolio, getPortfolioValue } = usePortfolio();
  const portfolioValue = getPortfolioValue();
  const gain = portfolioValue - 10000;
  const gainPercent = ((gain / 10000) * 100).toFixed(1);

  const isYoung = userAge < 8;

  return (
    <div className="dashboard-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '💰 Welcome to Money World!' : 'Your Investment Dashboard'}
      </h1>

      <div className="dashboard-grid">
        <PortfolioSummary
          portfolioValue={portfolioValue}
          gain={gain}
          gainPercent={gainPercent}
          cashAvailable={portfolio.cash}
          userAge={userAge}
        />
        <QuickStats userAge={userAge} />
      </div>

      <div className="cta-section">
        {isYoung ? (
          <p className="text-lg text-center">
            Ready to learn about money? Pick a lesson or buy your first stock! 🌟
          </p>
        ) : (
          <p className="text-center">
            Track your portfolio, learn about investing, and build wealth!
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
