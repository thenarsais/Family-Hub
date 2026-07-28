import React from 'react';

function CreditScoreMeter({ ficoScore, percentage, stars, label, color, userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;

  if (isYoung) {
    return (
      <div className="score-meter-young">
        <div className="stars-row">
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              className={i <= stars ? 'score-star--on' : 'score-star--off'}
            >
              ⭐
            </span>
          ))}
        </div>
        <p className="score-label-young" style={{ color }}>{label}</p>
      </div>
    );
  }

  // SVG half-circle arc gauge
  // rotate(-180) moves the circle's start from the rightmost point to the leftmost,
  // so the clockwise stroke traces the top semicircle left → right.
  const r = 85;
  const cx = 110;
  const cy = 110;
  const fullCirc = 2 * Math.PI * r;
  const halfCirc = Math.PI * r;
  const pct = isTeen ? (ficoScore - 300) / 550 : percentage / 100;
  const progress = pct * halfCirc;
  const displayScore = isTeen ? ficoScore : `${percentage}%`;

  return (
    <div className="score-meter">
      <svg width="220" height="125" viewBox="0 20 220 110">
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#e8e8e8"
          strokeWidth={22}
          strokeDasharray={`${halfCirc} ${fullCirc}`}
          transform={`rotate(-180 ${cx} ${cy})`}
        />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={22}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${fullCirc}`}
          transform={`rotate(-180 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x={cx} y={92} textAnchor="middle" fontSize="36" fontWeight="700" fill="#2d3436">
          {displayScore}
        </text>
        <text x={cx} y={112} textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>
          {label}
        </text>
      </svg>
    </div>
  );
}

export default CreditScoreMeter;
