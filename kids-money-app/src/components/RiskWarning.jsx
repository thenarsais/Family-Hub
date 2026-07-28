import React from 'react';
import '../styles/AdvancedTrading.css';

const CONFIG = {
  moderate: { bg: '#fff8e1', border: '#f0a500', icon: '⚠️' },
  high:     { bg: '#ffeef0', border: '#f44336', icon: '🚨' },
  extreme:  { bg: '#1c0000', border: '#b71c1c', icon: '💀', textColor: '#ffcdd2' },
};

function RiskWarning({ level = 'moderate', title, children }) {
  const c = CONFIG[level] || CONFIG.moderate;
  return (
    <div className="risk-warning" style={{ background: c.bg, borderLeftColor: c.border, color: c.textColor || '#333' }}>
      <p className="risk-warning-title">{c.icon} {title}</p>
      <div className="risk-warning-body">{children}</div>
    </div>
  );
}

export default RiskWarning;
