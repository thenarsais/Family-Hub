export const TOURS = {
  trading: {
    id: 'trading',
    title: 'Stock Trading Tour',
    icon: '📈',
    description: 'Learn how to buy and sell stocks step by step',
    steps: [
      {
        title: 'Welcome to Trading',
        instruction: 'This is where you buy and sell stocks. You start with $10,000 in virtual cash to invest across 5 fictional companies. Each stock card shows the name, ticker, price, and daily % change.',
        page: '/trading',
        tip: '💡 A stock = tiny ownership in a company. If the company grows, so does your share value.',
      },
      {
        title: 'Reading a Stock Card',
        instruction: 'Look at any stock card. The green or red % shows today\'s price movement. Green = price rose. Red = price fell. Prices update every 30 seconds to simulate real market movement.',
        page: '/trading',
        tip: '💡 In real markets, stock prices change every millisecond based on buyers and sellers worldwide.',
      },
      {
        title: 'Set Your Quantity',
        instruction: 'Each card has a quantity input. Set it to 5 on any stock you like. This means you\'ll buy 5 shares. The total cost = share price × quantity, which is deducted from your cash.',
        page: '/trading',
        tip: '💡 You can\'t buy more shares than your cash allows. The app will warn you if you try.',
      },
      {
        title: 'Make Your First Buy',
        instruction: 'Click the Buy button. You\'ll see a success message and your Available Cash decreases. You\'re now a shareholder! Notice the sell button appears once you own shares.',
        page: '/trading',
        tip: '💡 Buying is easy — the discipline is in deciding WHEN to buy and at what price.',
      },
      {
        title: 'Check Your Portfolio',
        instruction: 'Head to the Portfolio page using the nav bar. Your new holding appears in the Holdings table with your purchase price, current value, and quantity owned.',
        page: '/portfolio',
        tip: '💡 Your portfolio value updates live. Return to the Dashboard to see the performance chart grow.',
      },
    ],
  },

  budget: {
    id: 'budget',
    title: 'Budget Tracker Tour',
    icon: '💰',
    description: 'Track income and expenses to understand where money goes',
    steps: [
      {
        title: 'Your Budget Hub',
        instruction: 'The Budget page tracks real-world money — separate from your stock portfolio. Log allowance, chore earnings, and everything you spend. Three summary cards show Income, Expenses, and Balance at a glance.',
        page: '/budget',
        tip: '💡 Knowing where money goes is the first step to controlling it.',
      },
      {
        title: 'Log Your First Income',
        instruction: 'Click the "Add Income" tab. Choose a source (Allowance, Chores, Gift, etc.), enter an amount, and add an optional note. Click "Add Income" to save it.',
        page: '/budget',
        tip: '💡 Track income the moment you receive it — waiting causes you to forget smaller amounts.',
      },
      {
        title: 'Track an Expense',
        instruction: 'Click "Add Expense". Pick a category (Food, Entertainment, Savings Goal, etc.), enter what you spent, and save. The Overview tab\'s category bars will update.',
        page: '/budget',
        tip: '💡 Most people underestimate their spending by 20-30% until they start tracking every purchase.',
      },
      {
        title: 'Read the Overview',
        instruction: 'On the Overview tab, each category shows a bar: green = under your monthly goal, red = over budget. Recent transactions appear at the bottom in chronological order.',
        page: '/budget',
        tip: '💡 Visual spending bars make patterns obvious — you\'ll immediately see where you overspend.',
      },
      {
        title: 'Set Budget Goals (Teens)',
        instruction: 'If you\'re 13+, the "Budget Goals" tab lets you set monthly spending targets per category. For example: $50 food, $30 entertainment, $100 savings. These become your spending guardrails.',
        page: '/budget',
        tip: '💡 A budget isn\'t a restriction — it\'s a spending plan that gives you freedom to spend guilt-free on what matters.',
      },
    ],
  },

  credit: {
    id: 'credit',
    title: 'Credit Score Tour',
    icon: '💳',
    description: 'Understand how your credit score is calculated and how to improve it',
    steps: [
      {
        title: 'Your Credit Score',
        instruction: 'This simulator scores your financial behavior on a FICO-like scale. For ages 13+ it shows 300–850. For ages 8–12, a percentage. For young kids, 1–5 stars. All driven by the same 4 factors.',
        page: '/credit-score',
        tip: '💡 Real FICO scores (300–850) are used by banks, landlords, and employers to judge your financial reliability.',
      },
      {
        title: 'Factor 1: Cash Reserve (25%)',
        instruction: 'This rewards keeping some cash on hand — don\'t invest everything. Holding 50%+ of your portfolio as cash earns full marks. This mirrors "credit utilization" — keeping card balances low.',
        page: '/credit-score',
        tip: '💡 Real rule: keep credit card balances below 30% of your limit. Below 10% is ideal.',
      },
      {
        title: 'Factor 2: Diversification (25%)',
        instruction: 'Owning shares in multiple companies boosts this factor. Own all 5 stocks = 100%. Own 1 = 20%. Buy small amounts of several stocks rather than a lot of one.',
        page: '/credit-score',
        tip: '💡 Real parallel: having a mix of credit types (card, loan, mortgage) improves your credit mix score.',
      },
      {
        title: 'Factor 3 & 4: Growth + Activity',
        instruction: 'Portfolio Growth (35%) rewards growing your value above $10,000. Trading Activity (15%) rewards making trades, up to 15. Together these mirror payment history and credit history length.',
        page: '/credit-score',
        tip: '💡 In real life, on-time payments (35% of score) and long account history (15%) are the most impactful factors.',
      },
      {
        title: 'Dashboard Preview',
        instruction: 'Your score shows as a compact widget on the Dashboard. Click "View Details" anytime. As you trade and budget more actively, watch your score climb in real time.',
        page: '/',
        tip: '💡 In real life: check your free credit report at annualcreditreport.com. In the US you get 3 free reports per year.',
      },
    ],
  },
};
