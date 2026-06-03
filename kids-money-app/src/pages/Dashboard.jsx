import React from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { useCreditScore } from '../hooks/useCreditScore';
import PortfolioSummary from '../components/PortfolioSummary';
import QuickStats from '../components/QuickStats';
import '../styles/CreditScore.css';

function Dashboard({ userAge }) {
  const { portfolio, getPortfolioValue } = usePortfolio();
  const portfolioValue = getPortfolioValue();
  const gain = portfolioValue - 10000;
  const gainPercent = ((gain / 10000) * 100).toFixed(1);

  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const creditScore = useCreditScore();

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

      <div className="credit-score-preview">
        <div>
          <p className="credit-preview-heading">
            {isYoung ? 'Money Score' : 'Credit Score'}
          </p>
          <div className="credit-preview-score" style={{ color: creditScore.color }}>
            {isYoung
              ? `${creditScore.stars}/5 ⭐`
              : isTeen
              ? creditScore.ficoScore
              : `${creditScore.percentage}%`}
          </div>
          <p className="credit-preview-label" style={{ color: creditScore.color }}>
            {creditScore.label}
          </p>
        </div>
        <Link to="/credit-score" className="credit-preview-link">
          {isYoung ? 'See My Stars →' : 'View Details →'}
        </Link>
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
