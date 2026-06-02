import React from 'react';
import '../styles/TransactionHistory.css';

function TransactionHistory({ transactions, stocks }) {
  const sortedTransactions = [...transactions].reverse().slice(0, 10);

  return (
    <div className="transaction-history">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Stock</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((tx, idx) => {
            const stock = stocks.find(s => s.id === tx.stockId);
            return (
              <tr key={idx} className={tx.type === 'BUY' ? 'buy' : 'sell'}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td className="type">{tx.type === 'BUY' ? '🛒 Buy' : '💸 Sell'}</td>
                <td>{stock?.name || tx.stockId}</td>
                <td>{tx.quantity}</td>
                <td>${tx.price.toFixed(2)}</td>
                <td>${tx.total.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionHistory;
