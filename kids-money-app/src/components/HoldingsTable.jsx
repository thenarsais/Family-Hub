import React from 'react';
import '../styles/HoldingsTable.css';

function HoldingsTable({ holdings, userAge }) {
  const isYoung = userAge < 8;

  return (
    <div className="holdings-table">
      <table>
        <thead>
          <tr>
            <th>{isYoung ? '🏢' : 'Stock'}</th>
            <th>{isYoung ? '📦' : 'Qty'}</th>
            <th>{isYoung ? '💲' : 'Price'}</th>
            <th>{isYoung ? '💰' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(holding => (
            <tr key={holding.id}>
              <td>
                <strong>{holding.id}</strong>
              </td>
              <td>{holding.quantity}</td>
              <td>${holding.price.toFixed(2)}</td>
              <td className="total">${holding.totalValue.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HoldingsTable;
