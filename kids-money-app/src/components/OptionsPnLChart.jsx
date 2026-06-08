import React, { useMemo } from 'react';
import '../styles/AdvancedTrading.css';

const W = 580, H = 220, PAD_L = 60, PAD_R = 20, PAD_T = 20, PAD_B = 35;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

// At-expiry payoff formulas (per share; multiply by 100 for 1 contract)
const strategies = {
  longCall: ({ strike, premium }) =>
    s => Math.max(0, s - strike) - premium,
  longPut: ({ strike, premium }) =>
    s => Math.max(0, strike - s) - premium,
  bullCallSpread: ({ strike, strike2, premium }) =>
    s => Math.max(0, s - strike) - Math.max(0, s - strike2) - premium,
  longStraddle: ({ strike, premium }) =>
    s => Math.max(0, s - strike) + Math.max(0, strike - s) - premium,
};

const strategyMeta = {
  longCall:       { label: 'Long Call',         color: '#4caf50' },
  longPut:        { label: 'Long Put',           color: '#f44336' },
  bullCallSpread: { label: 'Bull Call Spread',   color: '#2196f3' },
  longStraddle:   { label: 'Long Straddle',      color: '#9c27b0' },
};

function OptionsPnLChart({ strategy = 'longCall', params = { strike: 100, strike2: 110, premium: 5 }, underlying = 100 }) {
  const payoff = strategies[strategy]?.(params) ?? (() => 0);

  // Price range: strike ±40%
  const base = params.strike || underlying;
  const lo = base * 0.60, hi = base * 1.40;
  const pts = 80;
  const step = (hi - lo) / pts;

  const data = useMemo(() => {
    const d = [];
    for (let i = 0; i <= pts; i++) {
      const s = lo + i * step;
      d.push({ s, pnl: payoff(s) * 100 }); // 1 contract = 100 shares
    }
    return d;
  }, [strategy, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  const pnls = data.map(d => d.pnl);
  const minPnl = Math.min(...pnls) * 1.15;
  const maxPnl = Math.max(...pnls, 0) * 1.15 + 50;
  const pnlRange = maxPnl - minPnl || 1;

  const toX = s => PAD_L + ((s - lo) / (hi - lo)) * PLOT_W;
  const toY = p => PAD_T + PLOT_H - ((p - minPnl) / pnlRange) * PLOT_H;

  const zeroY = toY(0);
  const col = strategyMeta[strategy]?.color || '#667eea';

  // Build path split at zero for coloring
  const posPath = [], negPath = [];
  let posD = '', negD = '', posOn = false, negOn = false;
  data.forEach(({ s, pnl }) => {
    const x = toX(s).toFixed(1), y = toY(pnl).toFixed(1);
    if (pnl >= 0) {
      posD += posOn ? ` L ${x} ${y}` : `M ${x} ${y}`; posOn = true; negOn = false;
    } else {
      negD += negOn ? ` L ${x} ${y}` : `M ${x} ${y}`; negOn = true; posOn = false;
    }
  });

  // Full path for the stroke
  let fullD = '', on = false;
  data.forEach(({ s, pnl }) => {
    const x = toX(s).toFixed(1), y = toY(pnl).toFixed(1);
    fullD += on ? ` L ${x} ${y}` : `M ${x} ${y}`; on = true;
  });

  // Breakeven points
  const breakevens = [];
  for (let i = 1; i < data.length; i++) {
    if ((data[i-1].pnl < 0) !== (data[i].pnl < 0)) {
      const bx = toX((data[i-1].s + data[i].s) / 2);
      breakevens.push(bx);
    }
  }

  // Max profit / max loss
  const maxProfit = Math.max(...pnls);
  const maxLoss   = Math.min(...pnls);
  const isUnlimitedProfit = strategy === 'longCall' || strategy === 'longStraddle';
  const isUnlimitedLoss   = false; // buying options = limited loss

  // Y-axis ticks
  const yTicks = [minPnl, 0, maxPnl].map(v => ({ y: toY(v), label: `$${v >= 0 ? '+' : ''}${Math.round(v)}` }));

  // X-axis tick at current underlying price and strike(s)
  const xMarkers = [
    { s: underlying, label: 'Current', color: '#888' },
    { s: params.strike, label: `K=${params.strike}`, color: col },
    ...(params.strike2 ? [{ s: params.strike2, label: `K₂=${params.strike2}`, color: col }] : []),
  ];

  return (
    <div className="pnl-chart-wrap">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* Background */}
        <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="#fafbff" />

        {/* Zero line */}
        <line x1={PAD_L} y1={zeroY} x2={PAD_L + PLOT_W} y2={zeroY} stroke="#999" strokeWidth="1.5" strokeDasharray="5 3" />

        {/* Profit fill (above zero) */}
        <clipPath id="aboveZero">
          <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={Math.max(0, zeroY - PAD_T)} />
        </clipPath>
        <path d={fullD} fill="#4caf5022" clipPath="url(#aboveZero)" />

        {/* Loss fill (below zero) */}
        <clipPath id="belowZero">
          <rect x={PAD_L} y={zeroY} width={PLOT_W} height={PLOT_H - (zeroY - PAD_T)} />
        </clipPath>
        <path d={fullD} fill="#f4433622" clipPath="url(#belowZero)" />

        {/* P&L line */}
        <path d={fullD} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" />

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L - 4} y1={t.y} x2={PAD_L + PLOT_W} y2={t.y} stroke={i === 1 ? '#999' : '#eee'} strokeWidth={i === 1 ? 1.5 : 1} strokeDasharray={i === 1 ? '5 3' : 'none'} />
            <text x={PAD_L - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill={i === 1 ? '#555' : '#bbb'} fontWeight={i === 1 ? '600' : '400'}>{t.label}</text>
          </g>
        ))}

        {/* X-axis markers */}
        {xMarkers.map((m, i) => {
          if (m.s < lo || m.s > hi) return null;
          const x = toX(m.s);
          return (
            <g key={i}>
              <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H + 4} stroke={m.color} strokeWidth="1" strokeDasharray="4 3" />
              <text x={x} y={PAD_T + PLOT_H + 16} textAnchor="middle" fontSize="9" fill={m.color}>{m.label}</text>
            </g>
          );
        })}

        {/* Breakeven markers */}
        {breakevens.map((bx, i) => (
          <g key={i}>
            <circle cx={bx} cy={zeroY} r="4" fill="white" stroke="#555" strokeWidth="1.5" />
            <text x={bx} y={zeroY - 8} textAnchor="middle" fontSize="8" fill="#555">BE</text>
          </g>
        ))}

        {/* Annotations */}
        <g transform={`translate(${PAD_L + 8}, ${PAD_T + 14})`}>
          <text fontSize="9" fill="#4caf50" fontWeight="600">
            Max profit: {isUnlimitedProfit ? 'Unlimited' : `$${maxProfit.toFixed(0)}`}
          </text>
          <text dy="14" fontSize="9" fill="#f44336" fontWeight="600">
            Max loss: {isUnlimitedLoss ? 'Unlimited' : `$${Math.abs(maxLoss).toFixed(0)}`}
          </text>
        </g>
      </svg>
    </div>
  );
}

export { strategies, strategyMeta };
export default OptionsPnLChart;
