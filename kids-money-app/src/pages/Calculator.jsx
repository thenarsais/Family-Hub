import React, { useState, useMemo } from 'react';
import '../styles/Calculator.css';

const FREQUENCIES = [
  { label: 'Yearly', n: 1 },
  { label: 'Monthly', n: 12 },
  { label: 'Daily', n: 365 },
];

function rateHint(rate) {
  if (rate <= 2) return 'Typical savings / money market rate';
  if (rate <= 5) return 'High-yield savings / bond rate';
  if (rate <= 10) return 'Near the S&P 500 historical average (~10%)';
  return 'High-risk / speculative territory';
}

function Calculator({ userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;

  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const [freqIdx, setFreqIdx] = useState(1);

  const n = isTeen ? FREQUENCIES[freqIdx].n : 12;

  const result = useMemo(() => {
    const r = rate / 100;
    const final = principal * Math.pow(1 + r / n, n * years);
    const interest = final - principal;
    const breakdown = [];
    for (let y = 1; y <= Math.min(years, 40); y++) {
      const val = principal * Math.pow(1 + r / n, n * y);
      const prevVal = y === 1 ? principal : principal * Math.pow(1 + r / n, n * (y - 1));
      breakdown.push({ year: y, value: val, totalInterest: val - principal, annualGrowth: val - prevVal });
    }
    return { final, interest, multiplier: final / principal, breakdown };
  }, [principal, rate, years, n]);

  return (
    <div className="calculator-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '🧮 Magic Money Calculator!' : 'Compound Interest Calculator'}
      </h1>

      {isYoung && (
        <div className="tip-box">
          <p>💡 Compound interest means your money earns interest — then THAT interest earns more interest. It grows faster and faster!</p>
        </div>
      )}

      <div className="calculator-layout">
        <div className="calculator-inputs">
          <div className="input-group">
            <label className="input-label">
              {isYoung ? '💰 Starting Money' : 'Principal (Starting Amount)'}
            </label>
            <div className="input-value-display">${principal.toLocaleString()}</div>
            <input type="range" min="100" max="10000" step="100" value={principal}
              onChange={e => setPrincipal(Number(e.target.value))} className="slider" />
            <div className="slider-bounds"><span>$100</span><span>$10,000</span></div>
          </div>

          <div className="input-group">
            <label className="input-label">
              {isYoung ? '📈 Interest Rate (how fast it grows)' : 'Annual Interest Rate'}
            </label>
            <div className="input-value-display">{rate}%</div>
            <input type="range" min="0.5" max="20" step="0.5" value={rate}
              onChange={e => setRate(Number(e.target.value))} className="slider" />
            <div className="slider-bounds"><span>0.5%</span><span>20%</span></div>
            {!isYoung && <p className="input-hint">{rateHint(rate)}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">
              {isYoung ? '⏰ How Many Years?' : 'Time Period (Years)'}
            </label>
            <div className="input-value-display">{years} {years === 1 ? 'year' : 'years'}</div>
            <input type="range" min="1" max="40" step="1" value={years}
              onChange={e => setYears(Number(e.target.value))} className="slider" />
            <div className="slider-bounds"><span>1 yr</span><span>40 yrs</span></div>
          </div>

          {isTeen && (
            <div className="input-group">
              <label className="input-label">Compounding Frequency</label>
              <div className="freq-buttons">
                {FREQUENCIES.map((f, i) => (
                  <button key={f.label} className={`freq-btn ${freqIdx === i ? 'active' : ''}`}
                    onClick={() => setFreqIdx(i)}>{f.label}</button>
                ))}
              </div>
              <p className="input-hint">
                {FREQUENCIES[freqIdx].label} compounding: interest calculated {FREQUENCIES[freqIdx].n}× per year
              </p>
            </div>
          )}
        </div>

        <div className="calculator-result">
          <div className="result-card">
            <p className="result-label">{isYoung ? '🤑 Your Money Grows To:' : 'Final Amount'}</p>
            <p className="result-amount">
              ${result.final.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="result-details">
            <div className="result-detail">
              <span>{isYoung ? '💵 You started with:' : 'Principal'}</span>
              <span>${principal.toLocaleString()}</span>
            </div>
            <div className="result-detail">
              <span>{isYoung ? '✨ Interest earned:' : 'Interest Earned'}</span>
              <span className="detail-positive">
                +${result.interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="result-detail">
              <span>{isYoung ? '📈 Money multiplied:' : 'Growth Multiplier'}</span>
              <span>{result.multiplier.toFixed(2)}×</span>
            </div>
          </div>

          {isYoung && (
            <div className="calc-insight calc-insight--young">
              <p>
                💡 Save ${principal} at {rate}% for {years} year{years !== 1 ? 's' : ''} and you'll have{' '}
                <strong>${result.final.toFixed(0)}</strong> — that's{' '}
                <strong>${result.interest.toFixed(0)}</strong> in FREE money! 🎉
              </p>
            </div>
          )}

          {isTeen && (
            <div className="calc-insight calc-insight--teen">
              <strong>Real-world benchmarks</strong>
              <p>S&P 500 historical return: ~10%/yr (7% inflation-adjusted). Money market account: ~4–5%. High-yield savings: ~4–5%. T-bills (1-year): ~5%.</p>
            </div>
          )}
        </div>
      </div>

      {!isYoung && (
        <div className="breakdown-section">
          <h2>{isTeen ? 'Year-by-Year Breakdown' : 'How Your Money Grows'}</h2>
          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Value</th>
                  <th>Total Interest</th>
                  {isTeen && <th>That Year's Growth</th>}
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((row, i) => (
                  <tr key={row.year} className={row.year % 5 === 0 ? 'milestone-row' : ''}>
                    <td>Year {row.year}</td>
                    <td>${row.value.toFixed(2)}</td>
                    <td className="detail-positive">+${row.totalInterest.toFixed(2)}</td>
                    {isTeen && <td className="detail-positive">+${row.annualGrowth.toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calculator;
