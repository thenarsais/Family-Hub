import React from 'react';
import { Link } from 'react-router-dom';
import { useCreditScore } from '../hooks/useCreditScore';
import CreditScoreMeter from '../components/CreditScoreMeter';
import '../styles/CreditScore.css';

function CreditScore({ userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const { ficoScore, percentage, stars, label, color, factors } = useCreditScore();

  return (
    <div className="credit-score-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '⭐ My Money Score!' : isTeen ? 'Credit Score Simulator' : '📊 My Credit Score'}
      </h1>

      <div className="score-hero">
        <CreditScoreMeter
          ficoScore={ficoScore}
          percentage={percentage}
          stars={stars}
          label={label}
          color={color}
          userAge={userAge}
        />

        {!isYoung && (
          <div className="score-range">
            <span className="range-label">300 Poor</span>
            <span className="range-label">580 Fair</span>
            <span className="range-label">670 Good</span>
            <span className="range-label">800 Exceptional</span>
          </div>
        )}

        {isYoung && (
          <p className="score-summary-young">
            You have <strong>{stars}</strong> out of 5 money stars!
            Keep trading and saving to earn more! 🌟
          </p>
        )}
      </div>

      <div className="factors-section">
        <h2>{isYoung ? '🌟 How to Earn More Stars' : 'Score Factors'}</h2>
        <div className="factors-grid">
          {Object.values(factors).map(factor => (
            <div key={factor.label} className="factor-card">
              <div className="factor-header">
                <span className="factor-name">
                  {isYoung ? factor.youngLabel : factor.label}
                </span>
                <span className="factor-pct" style={{ color }}>{factor.score}%</span>
              </div>
              <div className="factor-bar-bg">
                <div
                  className="factor-bar-fill"
                  style={{ width: `${factor.score}%`, background: color }}
                />
              </div>
              <p className="factor-tip">{isYoung ? factor.youngTip : factor.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="credit-learn-section">
        <h2>
          {isYoung ? '💡 Did You Know?' : isTeen ? 'About Credit Scores' : '📚 What is a Credit Score?'}
        </h2>

        {isYoung && (
          <div className="learn-card learn-card--single">
            <p>
              A money score shows how smart you are with your money!
              Save some cash, own different companies, and make trades to get a high score! ⭐
            </p>
          </div>
        )}

        {!isYoung && !isTeen && (
          <div className="learn-cards">
            <div className="learn-card">
              <strong>What is it?</strong>
              <p>A credit score is a number that shows how responsible you are with money. Banks use it to decide if they can lend you money.</p>
            </div>
            <div className="learn-card">
              <strong>Why does it matter?</strong>
              <p>A high credit score helps you get loans for big things like a car or house when you grow up — and at lower interest rates!</p>
            </div>
            <div className="learn-card">
              <strong>How to improve?</strong>
              <p>Keep cash in reserve, own a variety of investments, grow your portfolio value, and stay active with your finances.</p>
            </div>
          </div>
        )}

        {isTeen && (
          <div className="learn-cards">
            <div className="learn-card">
              <strong>Real FICO Scores</strong>
              <p>Credit scores range 300–850 in real life. Lenders use them to set loan interest rates — a 750 score can save thousands over a mortgage's lifetime vs. a 620 score.</p>
            </div>
            <div className="learn-card">
              <strong>Real-World Factors</strong>
              <p>Payment history (35%), credit utilization (30%), length of history (15%), credit mix (10%), new credit (10%). This simulator maps those proportions to your portfolio.</p>
            </div>
            <div className="learn-card">
              <strong>Credit Utilization</strong>
              <p>In real life, keep card balances below 30% of your limit. Our "Cash Reserve" factor mirrors this — holding too little cash drags your score, just like maxing out a card.</p>
            </div>
            <div className="learn-card">
              <strong>Building Credit Early</strong>
              <p>Become an authorized user on a parent's card at any age. At 18, open a secured or student credit card and pay the full balance monthly. Time in the game compounds.</p>
            </div>
          </div>
        )}
      </div>

      <div className="credit-cta">
        <Link to="/trading" className="btn-trade-more">
          {isYoung ? '📈 Trade More Stocks!' : 'Go to Trading →'}
        </Link>
      </div>
    </div>
  );
}

export default CreditScore;
