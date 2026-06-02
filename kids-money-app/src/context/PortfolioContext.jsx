import React, { createContext, useContext, useState, useEffect } from 'react';

const PortfolioContext = createContext();

// Mock fictional stocks for younger kids
const FICTIONAL_STOCKS = [
  { id: 'PIZZA', name: 'Pizza Palace Inc.', price: 45.50, change: 2.3 },
  { id: 'GAMES', name: 'Game Master Co.', price: 62.00, change: -1.2 },
  { id: 'CANDY', name: 'Sweet Treats Ltd.', price: 38.75, change: 4.1 },
  { id: 'BOOKS', name: 'Story World Inc.', price: 51.20, change: 0.8 },
  { id: 'TOYS', name: 'Toy Kingdom Co.', price: 72.40, change: 3.5 },
];

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio');
    return saved ? JSON.parse(saved) : {
      cash: 10000,
      holdings: {},
      transactions: [],
    };
  });

  const [stocks, setStocks] = useState(FICTIONAL_STOCKS);

  // Persist portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  // Simulate price changes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prevStocks =>
        prevStocks.map(stock => ({
          ...stock,
          price: parseFloat((stock.price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2)),
          change: parseFloat((Math.random() - 0.5) * 10).toFixed(1),
        }))
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const buyStock = (stockId, quantity) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return { success: false, message: 'Stock not found' };

    const cost = stock.price * quantity;
    if (cost > portfolio.cash) {
      return { success: false, message: 'Not enough cash!' };
    }

    setPortfolio(prev => ({
      ...prev,
      cash: prev.cash - cost,
      holdings: {
        ...prev.holdings,
        [stockId]: (prev.holdings[stockId] || 0) + quantity,
      },
      transactions: [
        ...prev.transactions,
        {
          type: 'BUY',
          stockId,
          quantity,
          price: stock.price,
          date: new Date().toISOString(),
          total: cost,
        },
      ],
    }));

    return { success: true, message: `Bought ${quantity} share(s) of ${stock.name}!` };
  };

  const sellStock = (stockId, quantity) => {
    if (!portfolio.holdings[stockId] || portfolio.holdings[stockId] < quantity) {
      return { success: false, message: 'Not enough shares to sell!' };
    }

    const stock = stocks.find(s => s.id === stockId);
    const proceeds = stock.price * quantity;

    setPortfolio(prev => ({
      ...prev,
      cash: prev.cash + proceeds,
      holdings: {
        ...prev.holdings,
        [stockId]: prev.holdings[stockId] - quantity,
      },
      transactions: [
        ...prev.transactions,
        {
          type: 'SELL',
          stockId,
          quantity,
          price: stock.price,
          date: new Date().toISOString(),
          total: proceeds,
        },
      ],
    }));

    return { success: true, message: `Sold ${quantity} share(s) of ${stock.name}!` };
  };

  const getPortfolioValue = () => {
    let value = portfolio.cash;
    Object.entries(portfolio.holdings).forEach(([stockId, quantity]) => {
      const stock = stocks.find(s => s.id === stockId);
      if (stock) value += stock.price * quantity;
    });
    return parseFloat(value.toFixed(2));
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        stocks,
        buyStock,
        sellStock,
        getPortfolioValue,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within PortfolioProvider');
  }
  return context;
}
