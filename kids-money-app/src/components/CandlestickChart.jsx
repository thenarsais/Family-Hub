import React, { useMemo } from 'react';
import '../styles/AdvancedTrading.css';

// ─── SVG layout constants ───────────────────────────────────────────────────
const W = 600, PAD_L = 52, PAD_R = 14, PAD_T = 18, PAD_B = 8;
const H_MAIN = 190, H_IND = 68, GAP = 20;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H_MAIN - PAD_T - PAD_B;

// ─── Price generation (seeded LCG so charts are deterministic) ──────────────
function genCandles(n, startPrice, seed, trend = 0) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  const rand = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  const candles = [];
  let price = startPrice;
  for (let i = 0; i < n; i++) {
    const bias = trend * 0.001;
    const ret = (rand() - 0.48 + bias) * 0.022;
    const open = price;
    const close = +(open * (1 + ret)).toFixed(2);
    const wick = 0.01 * Math.max(open, close);
    const high = +(Math.max(open, close) + rand() * wick * 1.5).toFixed(2);
    const low  = +(Math.min(open, close) - rand() * wick * 1.5).toFixed(2);
    candles.push({ open, high, low, close });
    price = close;
  }
  return candles;
}

// ─── Technical indicator maths ───────────────────────────────────────────────
function calcEMA(closes, p) {
  const k = 2 / (p + 1);
  const out = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < p - 1) { out.push(null); continue; }
    if (i === p - 1) { out.push(closes.slice(0, p).reduce((a, b) => a + b) / p); continue; }
    out.push(closes[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function calcRSI(closes, p = 14) {
  const out = [];
  let ag = 0, al = 0;
  for (let i = 1; i <= p && i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) ag += d; else al -= d;
  }
  ag /= p; al /= p;
  for (let i = 0; i < closes.length; i++) {
    if (i < p) { out.push(null); continue; }
    if (i > p) {
      const d = closes[i] - closes[i - 1];
      ag = (ag * (p - 1) + Math.max(d, 0)) / p;
      al = (al * (p - 1) + Math.max(-d, 0)) / p;
    }
    out.push(+(100 - 100 / (1 + (al === 0 ? 1e9 : ag / al))).toFixed(1));
  }
  return out;
}

function calcMACD(closes) {
  const e12 = calcEMA(closes, 12);
  const e26 = calcEMA(closes, 26);
  const macd = closes.map((_, i) => (e12[i] !== null && e26[i] !== null) ? e12[i] - e26[i] : null);
  const signal = calcEMA(macd.map(v => v ?? 0), 9).map((v, i) => macd[i] !== null && i >= 25 ? v : null);
  const hist = macd.map((v, i) => (v !== null && signal[i] !== null) ? v - signal[i] : null);
  return { macd, signal, hist };
}

// ─── SVG path helpers ────────────────────────────────────────────────────────
function buildLinePath(vals, toX, toY) {
  let d = '', on = false;
  vals.forEach((v, i) => {
    if (v === null) { on = false; return; }
    const x = toX(i).toFixed(1), y = toY(v).toFixed(1);
    d += on ? ` L ${x} ${y}` : `M ${x} ${y}`;
    on = true;
  });
  return d;
}

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   candles   – optional OHLC array; generated from seed if omitted
 *   seed      – for deterministic generation (default 42)
 *   startPrice
 *   n         – number of candles (default 50)
 *   indicator – 'rsi' | 'macd' | null
 *   showEMA   – bool
 *   title     – string label above chart
 *   trend     – number, slight directional bias (-1 to +1)
 */
function CandlestickChart({ candles: prop, seed = 42, startPrice = 150, n = 50,
                            indicator = 'rsi', showEMA = true, title, trend = 0 }) {
  const candles = useMemo(() => prop || genCandles(n, startPrice, seed, trend),
    [prop, seed, startPrice, n, trend]);

  const closes = candles.map(c => c.close);
  const ema9   = useMemo(() => showEMA ? calcEMA(closes, 9)  : [], [closes, showEMA]);
  const ema21  = useMemo(() => showEMA ? calcEMA(closes, 21) : [], [closes, showEMA]);
  const rsiV   = useMemo(() => indicator === 'rsi'  ? calcRSI(closes)   : [], [closes, indicator]);
  const macdV  = useMemo(() => indicator === 'macd' ? calcMACD(closes) : {}, [closes, indicator]);

  const nc = candles.length;
  const allP = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allP) * 0.998;
  const maxP = Math.max(...allP) * 1.002;
  const pRange = maxP - minP || 1;
  const cw = Math.max(2, (PLOT_W / nc) * 0.62);
  const toX = i => PAD_L + (i + 0.5) * (PLOT_W / nc);
  const toYp = v => PAD_T + PLOT_H - ((v - minP) / pRange) * PLOT_H;

  const showInd = !!indicator;
  const IND_Y0 = PAD_T + H_MAIN + GAP;
  const totalH = showInd ? PAD_T + H_MAIN + GAP + H_IND + PAD_B : PAD_T + H_MAIN + PAD_B;

  // RSI Y mapping
  const toYrsi = v => IND_Y0 + H_IND - (v / 100) * H_IND;

  // MACD Y mapping
  const macdVals = macdV.macd || [];
  const macdMin = Math.min(...macdVals.filter(v => v !== null), -0.5);
  const macdMax = Math.max(...macdVals.filter(v => v !== null), 0.5);
  const macdRange = macdMax - macdMin || 1;
  const toYmacd = v => IND_Y0 + H_IND - ((v - macdMin) / macdRange) * H_IND;
  const macdZeroY = toYmacd(0);

  // Price Y-axis ticks
  const pTicks = [minP, (minP + maxP) / 2, maxP];

  return (
    <div className="candle-chart-wrap">
      {title && <p className="candle-chart-title">{title}</p>}
      <svg width="100%" viewBox={`0 0 ${W} ${totalH}`} preserveAspectRatio="xMidYMid meet">

        {/* Price area bg */}
        <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} fill="#fafbff" />

        {/* Price grid + y-labels */}
        {pTicks.map((v, i) => {
          const y = toYp(v);
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y} stroke="#eee" strokeWidth="1" />
              <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#bbb">${v.toFixed(0)}</text>
            </g>
          );
        })}

        {/* Candles */}
        {candles.map((c, i) => {
          const x = toX(i);
          const bull = c.close >= c.open;
          const col = bull ? '#26a69a' : '#ef5350';
          const bTop = toYp(Math.max(c.open, c.close));
          const bBot = toYp(Math.min(c.open, c.close));
          const bH = Math.max(1, bBot - bTop);
          return (
            <g key={i}>
              <line x1={x} y1={toYp(c.high)} x2={x} y2={toYp(c.low)} stroke={col} strokeWidth="1" />
              <rect x={x - cw / 2} y={bTop} width={cw} height={bH} fill={col} />
            </g>
          );
        })}

        {/* EMA lines */}
        {showEMA && (
          <>
            <path d={buildLinePath(ema9,  toX, toYp)} fill="none" stroke="#f5c518" strokeWidth="1.5" />
            <path d={buildLinePath(ema21, toX, toYp)} fill="none" stroke="#ff9800" strokeWidth="1.5" />
            <g transform={`translate(${PAD_L + 5}, ${PAD_T + 12})`}>
              <rect x="0" y="-5" width="14" height="3" fill="#f5c518" />
              <text x="18" y="0" fontSize="9" fill="#888">EMA 9</text>
              <rect x="62" y="-5" width="14" height="3" fill="#ff9800" />
              <text x="80" y="0" fontSize="9" fill="#888">EMA 21</text>
            </g>
          </>
        )}

        {/* RSI panel */}
        {indicator === 'rsi' && (
          <>
            <rect x={PAD_L} y={IND_Y0} width={PLOT_W} height={H_IND} fill="#fafbff" />
            {[70, 50, 30].map(lvl => (
              <g key={lvl}>
                <line x1={PAD_L} y1={toYrsi(lvl)} x2={PAD_L + PLOT_W} y2={toYrsi(lvl)}
                  stroke={lvl === 50 ? '#e0e0e0' : '#ffcdd2'} strokeDasharray="4 3" strokeWidth="1" />
                <text x={PAD_L - 4} y={toYrsi(lvl) + 4} textAnchor="end" fontSize="8" fill="#ccc">{lvl}</text>
              </g>
            ))}
            <path d={buildLinePath(rsiV, toX, toYrsi)} fill="none" stroke="#667eea" strokeWidth="1.5" />
            <text x={PAD_L + 4} y={IND_Y0 + 11} fontSize="9" fill="#888" fontWeight="600">RSI(14)</text>
          </>
        )}

        {/* MACD panel */}
        {indicator === 'macd' && (
          <>
            <rect x={PAD_L} y={IND_Y0} width={PLOT_W} height={H_IND} fill="#fafbff" />
            <line x1={PAD_L} y1={macdZeroY} x2={PAD_L + PLOT_W} y2={macdZeroY}
              stroke="#ddd" strokeWidth="1" />
            {/* Histogram bars */}
            {(macdV.hist || []).map((v, i) => {
              if (v === null) return null;
              const x = toX(i);
              const bw = Math.max(1.5, cw * 0.8);
              const y = toYmacd(v);
              const h = Math.abs(y - macdZeroY);
              return <rect key={i} x={x - bw / 2} y={Math.min(y, macdZeroY)} width={bw} height={Math.max(1, h)} fill={v >= 0 ? '#26a69a88' : '#ef535088'} />;
            })}
            <path d={buildLinePath(macdV.macd || [], toX, toYmacd)} fill="none" stroke="#2196f3" strokeWidth="1.5" />
            <path d={buildLinePath(macdV.signal || [], toX, toYmacd)} fill="none" stroke="#ff9800" strokeWidth="1.2" strokeDasharray="4 2" />
            <g transform={`translate(${PAD_L + 4}, ${IND_Y0 + 11})`}>
              <text fontSize="9" fill="#888" fontWeight="600">MACD</text>
              <rect x="42" y="-6" width="12" height="3" fill="#2196f3" />
              <text x="58" y="0" fontSize="8" fill="#888">MACD</text>
              <rect x="102" y="-6" width="12" height="3" fill="#ff9800" />
              <text x="118" y="0" fontSize="8" fill="#888">Signal</text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
}

export default CandlestickChart;
