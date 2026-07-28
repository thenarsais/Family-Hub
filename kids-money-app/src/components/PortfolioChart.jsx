import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import '../styles/PortfolioChart.css';

const W = 500;
const H = 180;
const PAD_L = 52;
const PAD_R = 20;
const PAD_T = 18;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

function PortfolioChart({ userAge }) {
  const { portfolio } = usePortfolio();
  const history = portfolio.valueHistory || [];

  if (history.length < 2) {
    return (
      <div className="chart-empty">
        <p>{userAge < 8 ? '📈 Make your first trade to see your chart!' : 'Make a trade to see portfolio performance over time.'}</p>
      </div>
    );
  }

  const values = history.map(h => h.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Ensure $10,000 baseline is visible and give some padding
  const minVal = Math.min(rawMin, 10000) * 0.995;
  const maxVal = Math.max(rawMax, 10000) * 1.005;
  const range = maxVal - minVal || 500;

  const toX = i => PAD_L + (i / (history.length - 1)) * PLOT_W;
  const toY = v => PAD_T + PLOT_H - ((v - minVal) / range) * PLOT_H;

  const pts = history.map((h, i) => `${toX(i).toFixed(1)},${toY(h.value).toFixed(1)}`).join(' ');
  const lastVal = history[history.length - 1].value;
  const isProfit = lastVal >= 10000;
  const lineColor = isProfit ? '#4caf50' : '#f44336';

  const areaPath = [
    `M ${toX(0).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`,
    `L ${pts}`,
    `L ${toX(history.length - 1).toFixed(1)},${(PAD_T + PLOT_H).toFixed(1)}`,
    'Z',
  ].join(' ');

  const refY = toY(10000);
  const showRef = refY >= PAD_T && refY <= PAD_T + PLOT_H;

  // 3 y-axis labels: min, $10k (if visible), max
  const yLabels = [
    { y: toY(maxVal), label: `$${(maxVal / 1000).toFixed(1)}k` },
    ...(showRef ? [{ y: refY, label: '$10k' }] : []),
    { y: toY(minVal), label: `$${(minVal / 1000).toFixed(1)}k` },
  ];

  return (
    <div className="portfolio-chart">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {showRef && (
          <line x1={PAD_L} y1={refY} x2={W - PAD_R} y2={refY}
            stroke="#ddd" strokeDasharray="4 3" strokeWidth="1" />
        )}
        {yLabels.map((lbl, i) => (
          <text key={i} x={PAD_L - 4} y={lbl.y + 4} textAnchor="end" fontSize="9" fill="#bbb">{lbl.label}</text>
        ))}
        <path d={areaPath} fill={lineColor} fillOpacity="0.08" />
        <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={toX(history.length - 1)} cy={toY(lastVal)} r="5"
          fill={lineColor} stroke="white" strokeWidth="2" />
      </svg>
    </div>
  );
}

export default PortfolioChart;
