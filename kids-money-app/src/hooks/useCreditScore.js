import { usePortfolio } from '../context/PortfolioContext';

const STARTING_CASH = 10000;
const TOTAL_STOCKS = 5;
const MAX_TRANSACTIONS = 15;

function getLabel(fico) {
  if (fico >= 800) return 'Exceptional';
  if (fico >= 740) return 'Very Good';
  if (fico >= 670) return 'Good';
  if (fico >= 580) return 'Fair';
  return 'Poor';
}

function getColor(fico) {
  if (fico >= 800) return '#4caf50';
  if (fico >= 740) return '#8bc34a';
  if (fico >= 670) return '#f0a500';
  if (fico >= 580) return '#ff9800';
  return '#f44336';
}

export function useCreditScore() {
  const { portfolio, getPortfolioValue } = usePortfolio();
  const totalValue = getPortfolioValue();

  // Factor 1: Cash reserve (25%) — mirrors credit utilization; reward not going all-in
  const cashRatio = portfolio.cash / totalValue;
  const cashScore = Math.min(cashRatio * 2, 1); // peaks at 50% cash held

  // Factor 2: Diversification (25%) — reward spreading across companies
  const uniqueStocks = Object.values(portfolio.holdings).filter(q => q > 0).length;
  const divScore = uniqueStocks / TOTAL_STOCKS;

  // Factor 3: Portfolio growth (35%) — normalized from -30% to +30% range
  const growthRate = (totalValue - STARTING_CASH) / STARTING_CASH;
  const growthScore = Math.min(Math.max((growthRate + 0.3) / 0.6, 0), 1);

  // Factor 4: Trading activity (15%) — reward engagement up to MAX_TRANSACTIONS
  const activityScore = Math.min(portfolio.transactions.length / MAX_TRANSACTIONS, 1);

  const composite = cashScore * 0.25 + divScore * 0.25 + growthScore * 0.35 + activityScore * 0.15;
  const ficoScore = Math.round(300 + composite * 550);
  const percentage = Math.round(composite * 100);
  const stars = Math.max(1, Math.round(composite * 5));

  return {
    ficoScore,
    percentage,
    stars,
    label: getLabel(ficoScore),
    color: getColor(ficoScore),
    factors: {
      cashReserve: {
        score: Math.round(cashScore * 100),
        label: 'Cash Reserve',
        youngLabel: 'Saving Money',
        tip: 'Keep some cash on hand instead of investing everything',
        youngTip: 'Always keep some money saved just in case!',
      },
      diversification: {
        score: Math.round(divScore * 100),
        label: 'Diversification',
        youngLabel: 'Different Companies',
        tip: `Own stocks in ${uniqueStocks} of ${TOTAL_STOCKS} companies`,
        youngTip: `You own stocks in ${uniqueStocks} different companies!`,
      },
      growth: {
        score: Math.round(growthScore * 100),
        label: 'Portfolio Growth',
        youngLabel: 'Growing Money',
        tip: `Portfolio is ${growthRate >= 0 ? '+' : ''}${(growthRate * 100).toFixed(1)}% from your starting $10,000`,
        youngTip: growthRate >= 0 ? 'Your money is growing — great job!' : 'Keep trading to grow your money!',
      },
      activity: {
        score: Math.round(activityScore * 100),
        label: 'Trading Activity',
        youngLabel: 'Trades Made',
        tip: `${portfolio.transactions.length} of ${MAX_TRANSACTIONS} trades completed`,
        youngTip: `You've made ${portfolio.transactions.length} trades so far!`,
      },
    },
  };
}
