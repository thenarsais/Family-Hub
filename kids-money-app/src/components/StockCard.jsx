import React, { useState } from 'react';
import '../styles/StockCard.css';

function StockCard({ stock, userHolding, userAge, onBuy, onSell }) {
  const [quantity, setQuantity] = useState(1);
  const isYoung = userAge < 8;

  const handleBuy = () => {
    if (quantity > 0) {
      onBuy(stock.id, parseInt(quantity));
      setQuantity(1);
    }
  };

  const handleSell = () => {
    if (quantity > 0 && quantity <= userHolding) {
      onSell(stock.id, parseInt(quantity));
      setQuantity(1);
    }
  };

  return (
    <div className="stock-card">
      <div className="stock-header">
        <h3 className={isYoung ? 'text-2xl' : ''}>{stock.name}</h3>
        <p className="stock-ticker">{stock.id}</p>
      </div>

      <div className="stock-price">
        <p className={`price ${isYoung ? 'text-3xl' : ''}`}>${stock.price.toFixed(2)}</p>
        <p className={`change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
          {stock.change >= 0 ? '📈' : '📉'} {Math.abs(stock.change).toFixed(1)}%
        </p>
      </div>

      {userHolding > 0 && (
        <p className="holding">You own: {userHolding} share{userHolding !== 1 ? 's' : ''}</p>
      )}

      <div className="quantity-selector">
        <label>{isYoung ? 'How many?' : 'Quantity:'}</label>
        <input
          type="number"
          min="1"
          max={userHolding}
          value={quantity}
          onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className={isYoung ? 'large-input' : ''}
        />
      </div>

      <div className="action-buttons">
        <button onClick={handleBuy} className="btn-buy">
          {isYoung ? '🛒 Buy' : 'Buy'}
        </button>
        {userHolding > 0 && (
          <button onClick={handleSell} className="btn-sell">
            {isYoung ? '💸 Sell' : 'Sell'}
          </button>
        )}
      </div>
    </div>
  );
}

export default StockCard;
