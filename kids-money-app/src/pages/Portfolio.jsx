import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import HoldingsTable from '../components/HoldingsTable';
import TransactionHistory from '../components/TransactionHistory';
import '../styles/Portfolio.css';

function Portfolio({ userAge }) {
  const { portfolio, stocks, getPortfolioValue } = usePortfolio();
  const isYoung = userAge < 8;

  const holdings = Object.entries(portfolio.holdings)
    .filter(([_, quantity]) => quantity > 0)
    .map(([stockId, quantity]) => {
      const stock = stocks.find(s => s.id === stockId);
      return {
        ...stock,
        quantity,
        totalValue: stock.price * quantity,
        costBasis: 0, // Could be calculated from transactions
      };
    });

  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);

  return (
    <div className="portfolio-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '🎒 My Stocks' : 'Portfolio Details'}
      </h1>

      <div className="portfolio-overview">
        <div className="overview-card">
          <p className="label">Cash</p>
          <p className="value">${portfolio.cash.toFixed(2)}</p>
        </div>
        <div className="overview-card">
          <p className="label">Holdings Value</p>
          <p className="value">${totalHoldingsValue.toFixed(2)}</p>
        </div>
        <div className="overview-card">
          <p className="label">Total Portfolio</p>
          <p className="value highlight">${getPortfolioValue().toFixed(2)}</p>
        </div>
      </div>

      {holdings.length > 0 ? (
        <>
          <section className="holdings-section">
            <h2>Current Holdings</h2>
            <HoldingsTable holdings={holdings} userAge={userAge} />
          </section>
        </>
      ) : (
        <div className="empty-state">
          <p className={isYoung ? 'text-2xl' : ''}>
            {isYoung ? '📭 No stocks yet! Buy some to get started!' : 'You don\'t have any stocks yet. Visit Trading to buy some!'}
          </p>
        </div>
      )}

      {portfolio.transactions.length > 0 && (
        <section className="transactions-section">
          <h2>Recent Transactions</h2>
          <TransactionHistory transactions={portfolio.transactions} stocks={stocks} />
        </section>
      )}
    </div>
  );
}

export default Portfolio;
