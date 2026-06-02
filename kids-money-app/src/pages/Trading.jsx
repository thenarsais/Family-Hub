import React, { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import StockCard from '../components/StockCard';
import '../styles/Trading.css';

function Trading({ userAge }) {
  const { stocks, portfolio, buyStock, sellStock } = usePortfolio();
  const [message, setMessage] = useState('');

  const isYoung = userAge < 8;

  const handleBuy = (stockId, quantity) => {
    const result = buyStock(stockId, quantity);
    setMessage(result.message);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSell = (stockId, quantity) => {
    const result = sellStock(stockId, quantity);
    setMessage(result.message);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="trading-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '📈 Buy & Sell Stocks!' : 'Stock Trading'}
      </h1>

      <div className="cash-display">
        <p className={isYoung ? 'text-2xl' : 'text-lg'}>
          💵 Available Cash: ${portfolio.cash.toFixed(2)}
        </p>
      </div>

      {message && <div className="message-banner">{message}</div>}

      <div className="stocks-grid">
        {stocks.map(stock => (
          <StockCard
            key={stock.id}
            stock={stock}
            userHolding={portfolio.holdings[stock.id] || 0}
            userAge={userAge}
            onBuy={handleBuy}
            onSell={handleSell}
          />
        ))}
      </div>

      {isYoung && (
        <div className="tip-box">
          <p>💡 Tip: Buy stocks you think will go up! Sell when the price is high!</p>
        </div>
      )}
    </div>
  );
}

export default Trading;
