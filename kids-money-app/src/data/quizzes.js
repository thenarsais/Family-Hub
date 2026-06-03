// ─────────────────────────────────────────────────────────────────────────────
// Quiz data: 5 categories × 3 age groups × 6 questions = 90 questions
// Skill recommendations: links back to relevant app content when score is low
// ─────────────────────────────────────────────────────────────────────────────

export const QUIZ_CATEGORIES = [
  { id: 'trading',  label: 'Stocks & Trading',       icon: '📈', color: '#667eea' },
  { id: 'budget',   label: 'Budgeting & Income',      icon: '💰', color: '#4caf50' },
  { id: 'credit',   label: 'Credit & Borrowing',      icon: '💳', color: '#f0a500' },
  { id: 'savings',  label: 'Saving & Interest',       icon: '🏦', color: '#2196f3' },
  { id: 'markets',  label: 'Money Markets',           icon: '🏛️', color: '#9c27b0' },
];

// Recommendations shown when score < 75%. Each entry links to a specific
// resource in the app so users know exactly where to go to fill the gap.
export const SKILL_RECOMMENDATIONS = {
  trading: {
    tour:     { label: 'Take the Stock Trading Tour',         path: '/tutorials', tourId: 'trading' },
    scenario: { label: 'Try "Buy Your First Stock" scenario', path: '/tutorials', scenarioId: 'first-stock' },
    page:     { label: 'Make a practice trade',              path: '/trading' },
    lessons:  { label: 'Read Stock Lessons',                  path: '/lessons' },
  },
  budget: {
    tour:     { label: 'Take the Budget Tracker Tour',          path: '/tutorials', tourId: 'budget' },
    scenario: { label: 'Try the Monthly Budget Challenge',      path: '/tutorials', scenarioId: 'monthly-budget' },
    page:     { label: 'Log income in Budget tracker',          path: '/budget' },
    lessons:  { label: 'Read Money Lessons',                    path: '/lessons' },
  },
  credit: {
    tour:     { label: 'Take the Credit Score Tour',            path: '/tutorials', tourId: 'credit' },
    scenario: { label: 'Try "Build Credit Responsibly"',        path: '/tutorials', scenarioId: 'build-credit' },
    page:     { label: 'Check your Credit Score breakdown',     path: '/credit-score' },
    lessons:  { label: 'Read advanced lessons',                 path: '/lessons' },
  },
  savings: {
    tour:     { label: 'Try "Emergency Fund First" scenario',   path: '/tutorials', scenarioId: 'emergency-fund' },
    scenario: { label: 'Try "Save for a Bike" scenario',        path: '/tutorials', scenarioId: 'save-for-bike' },
    page:     { label: 'Use the Compound Interest Calculator',  path: '/calculator' },
    lessons:  { label: 'Read Money Lessons',                    path: '/lessons' },
  },
  markets: {
    tour:     { label: 'Use the Compound Interest Calculator',  path: '/calculator' },
    scenario: { label: 'Try "Emergency Fund First" scenario',   path: '/tutorials', scenarioId: 'emergency-fund' },
    page:     { label: 'Read advanced lessons',                 path: '/lessons' },
    lessons:  { label: 'Re-take the Money Markets Quiz',        path: '/quiz' },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Question banks
// ─────────────────────────────────────────────────────────────────────────────

export const QUESTIONS = {

  // ── STOCKS & TRADING ────────────────────────────────────────────
  trading: {
    young: [
      {
        q: 'What is a stock?',
        options: ['A type of food', 'A tiny piece of ownership in a company', 'A kind of toy', 'Money in a bank'],
        answer: 1,
        explanation: 'Buying a stock means you own a tiny piece of that company. If the company does well, your piece becomes worth more!',
      },
      {
        q: 'Why do people buy stocks?',
        options: ['To collect them like cards', 'To make money when the company grows', 'Because they have to', 'To give them away'],
        answer: 1,
        explanation: 'When a company earns more money and grows bigger, its stock price goes up — and so does the value of your shares!',
      },
      {
        q: 'If you own 5 shares and the price goes up by $2, how much do you gain?',
        options: ['$2', '$5', '$10', '$7'],
        answer: 2,
        explanation: '5 shares × $2 gain = $10! That\'s why owning more shares means bigger gains (and bigger losses if the price drops).',
      },
      {
        q: 'What does "selling a stock" mean?',
        options: ['Throwing it away', 'Giving it to a friend', 'Trading your shares back for money', 'Buying more shares'],
        answer: 2,
        explanation: 'When you sell, you give back your shares and receive money in return. If the price went up since you bought, you make a profit!',
      },
      {
        q: 'Can you lose money investing in stocks?',
        options: ['No, stocks always go up', 'Yes, prices can go down', 'Only if you sell', 'No, the government protects you'],
        answer: 1,
        explanation: 'Yes! Prices can go down as well as up. That\'s why we never invest money we can\'t afford to lose, and we spread across many stocks.',
      },
      {
        q: 'What is a "portfolio"?',
        options: ['A type of bag', 'All the stocks and investments you own', 'A bank account', 'A stock certificate'],
        answer: 1,
        explanation: 'Your portfolio is your collection of all investments — stocks, savings, and everything else you own as investments.',
      },
    ],
    intermediate: [
      {
        q: 'What does it mean to "diversify" your investments?',
        options: [
          'Put all your money in one great stock',
          'Spread money across many different stocks and asset types',
          'Only buy stocks in one country',
          'Trade stocks every day',
        ],
        answer: 1,
        explanation: 'Diversification spreads risk. If one company fails, others in your portfolio may still do well — you don\'t lose everything.',
      },
      {
        q: 'What happens to a stock\'s price when many people want to buy it?',
        options: ['It stays the same', 'It goes down', 'It goes up', 'It disappears'],
        answer: 2,
        explanation: 'Supply and demand: more buyers than sellers = higher price. This is why popular companies have high stock prices.',
      },
      {
        q: 'What is the "cost basis" of a stock?',
        options: [
          'The lowest price the stock ever reached',
          'The price you originally paid for the shares',
          'The current market price',
          'The price at which you sold',
        ],
        answer: 1,
        explanation: 'Cost basis is what YOU paid. Gain or loss = current price − cost basis. It determines your profit when you sell.',
      },
      {
        q: 'What does "buy low, sell high" mean?',
        options: [
          'Buy expensive stocks and sell cheap ones',
          'Buy when the price is low and sell when it rises to make a profit',
          'Only buy stocks under $10',
          'Sell immediately after buying',
        ],
        answer: 1,
        explanation: 'The goal of investing: buy shares for less than you eventually sell them for. The gap between buy price and sell price is your profit.',
      },
      {
        q: 'Why do stock prices change every day?',
        options: [
          'Banks set new prices each morning',
          'Because of buyers and sellers trading throughout the day',
          'The government updates them',
          'Prices don\'t actually change daily',
        ],
        answer: 1,
        explanation: 'Every trade that happens changes the price slightly. Millions of trades per second = constantly moving prices.',
      },
      {
        q: 'What is a "shareholder"?',
        options: [
          'Someone who works at a company',
          'Anyone who owns shares/stock in a company',
          'A bank employee',
          'Someone who lends money to companies',
        ],
        answer: 1,
        explanation: 'Shareholders are partial owners of a company. Large shareholders may even vote on company decisions!',
      },
    ],
    teen: [
      {
        q: 'What is a P/E ratio?',
        options: [
          'Profit to Earnings — measures company profitability',
          'Price to Earnings — compares stock price to earnings per share',
          'Price to Equity — measures debt level',
          'Portfolio to Earnings — measures investment returns',
        ],
        answer: 1,
        explanation: 'P/E = Stock Price ÷ Earnings Per Share. A P/E of 20 means investors pay $20 for every $1 of earnings. Higher P/E = growth expectations priced in.',
      },
      {
        q: 'What is a dividend?',
        options: [
          'A fee charged when buying stocks',
          'A portion of company profits paid directly to shareholders',
          'The difference between buy and sell price',
          'A type of bond',
        ],
        answer: 1,
        explanation: 'Dividends are cash distributions to shareholders. "Dividend yield" = annual dividend ÷ stock price. Income investors often target high-yield dividend stocks.',
      },
      {
        q: 'What is dollar-cost averaging (DCA)?',
        options: [
          'Buying only the cheapest stocks available',
          'Investing the same dollar amount at regular intervals regardless of price',
          'Selling stocks when they reach a specific dollar value',
          'Only buying stocks priced under $100',
        ],
        answer: 1,
        explanation: 'DCA removes the pressure of market timing. When prices are high you buy fewer shares; when low, more. Over time it averages out favorably.',
      },
      {
        q: 'What is an index fund?',
        options: [
          'A fund managed by an expert picking the best stocks',
          'A fund that tracks a market index like the S&P 500 with low fees',
          'A government bond fund',
          'A fund for a single company\'s stock',
        ],
        answer: 1,
        explanation: 'Index funds passively track an index. They charge ~0.03% vs ~1% for active funds, and historically outperform most active managers over 10+ years.',
      },
      {
        q: 'What does "going long" on a stock mean?',
        options: [
          'Holding a stock for a long time',
          'Buying shares expecting the price to rise',
          'Borrowing shares to sell them',
          'Holding 100+ shares of a company',
        ],
        answer: 1,
        explanation: '"Going long" = standard buying. The opposite is "short selling" — borrowing shares, selling them, then buying back cheaper to profit from a price drop.',
      },
      {
        q: 'What is market capitalization?',
        options: [
          'The maximum amount a stock can be worth',
          'Total shares outstanding × current share price',
          'Annual revenue of the company',
          'The total value of all stock markets combined',
        ],
        answer: 1,
        explanation: 'Market cap = shares outstanding × price. Apple at ~$180/share × ~15B shares = ~$2.7 trillion market cap. Large-cap (>$10B), mid-cap ($2-10B), small-cap (<$2B).',
      },
    ],
  },

  // ── BUDGETING & INCOME ───────────────────────────────────────────
  budget: {
    young: [
      {
        q: 'What is a budget?',
        options: ['A type of toy', 'A plan for how to spend and save your money', 'A bank account', 'Money you borrow'],
        answer: 1,
        explanation: 'A budget is your money plan! It helps you decide ahead of time how much to spend, save, and give away.',
      },
      {
        q: 'If you earn $10 allowance and spend $6, how much do you save?',
        options: ['$4', '$6', '$16', '$10'],
        answer: 0,
        explanation: '$10 − $6 = $4 saved! Every dollar you don\'t spend is a dollar that stays in your pocket (or grows in a bank).',
      },
      {
        q: 'Which of these is a "need" (not a want)?',
        options: ['New video game', 'Candy bar', 'School lunch', 'Action figure'],
        answer: 2,
        explanation: 'Needs are things you MUST have to live safely — food, shelter, clothing. Wants are extras. School lunch is a need; candy is a want!',
      },
      {
        q: 'What does "tracking your spending" mean?',
        options: [
          'Chasing after your money',
          'Writing down everything you buy so you know where your money goes',
          'Counting how many coins you have',
          'Spending money very carefully',
        ],
        answer: 1,
        explanation: 'Tracking means recording every purchase. When you see the numbers, you often realize how quickly small things add up!',
      },
      {
        q: 'Which is a good saving habit?',
        options: [
          'Spend all your allowance the day you get it',
          'Save some money before spending any',
          'Only save money at the end of the month',
          'Never spend money on anything',
        ],
        answer: 1,
        explanation: '"Pay yourself first" — save BEFORE spending on fun things. This way, saving happens for sure instead of only if there\'s leftover.',
      },
      {
        q: 'What is "allowance"?',
        options: [
          'Money you borrow from a bank',
          'Regular money given to you (usually weekly) by a parent',
          'Money you find on the ground',
          'A type of savings account',
        ],
        answer: 1,
        explanation: 'Allowance is income! Treat it like a paycheck — plan how to split it between spending, saving, and maybe giving.',
      },
    ],
    intermediate: [
      {
        q: 'What is the 50/30/20 budget rule?',
        options: [
          'Save 50%, spend 30% on needs, 20% on wants',
          '50% needs, 30% wants, 20% savings',
          '50% savings, 30% investments, 20% spending',
          '50% spending, 30% giving, 20% saving',
        ],
        answer: 1,
        explanation: '50/30/20 is a simple budgeting framework. Half your income covers necessities, 30% enjoyment, and at least 20% goes to savings or debt repayment.',
      },
      {
        q: 'What does "living within your means" mean?',
        options: [
          'Living in a small house',
          'Spending less money than you earn',
          'Only buying cheap things',
          'Not going on vacation',
        ],
        answer: 1,
        explanation: 'If you spend less than you earn, the difference builds wealth. If you spend MORE than you earn, you go into debt. The gap is everything.',
      },
      {
        q: 'What is a "fixed expense"?',
        options: [
          'An expense you can change whenever you want',
          'An expense that stays the same amount each month',
          'A one-time emergency purchase',
          'Money you spend on entertainment',
        ],
        answer: 1,
        explanation: 'Fixed expenses (rent, phone bill, subscriptions) are predictable — same amount each month. Variable expenses (groceries, entertainment) change.',
      },
      {
        q: 'What does "paying yourself first" mean?',
        options: [
          'Paying your own bills before others',
          'Automatically saving a portion of income before spending anything else',
          'Getting paid before others at work',
          'Keeping cash at home instead of a bank',
        ],
        answer: 1,
        explanation: 'If you save "what\'s left over," there\'s often nothing left. Automate savings to come out first — then live on what remains. It rewires your habits.',
      },
      {
        q: 'What is "discretionary spending"?',
        options: [
          'Money spent on absolute necessities like food and rent',
          'Money spent on non-essentials — eating out, entertainment, hobbies',
          'Money you donate to charity',
          'Regular savings contributions',
        ],
        answer: 1,
        explanation: 'Discretionary = optional. This is where most budgets are cut when times are tough. Tracking it shows you where money "disappears."',
      },
      {
        q: 'Why should you track both income AND expenses?',
        options: [
          'You only need to track expenses',
          'Because you need both to know your true balance and spending rate',
          'Income tracking is only for businesses',
          'You only need to track income',
        ],
        answer: 1,
        explanation: 'Balance = Income − Expenses. Missing either side gives you an incomplete picture. Many people underestimate spending by 20-30% without tracking.',
      },
    ],
    teen: [
      {
        q: 'What is gross income vs. net income?',
        options: [
          'Gross = after taxes; net = before taxes',
          'Gross = total before deductions; net = what you actually take home',
          'They are the same thing',
          'Gross = monthly; net = annual',
        ],
        answer: 1,
        explanation: 'Always budget based on net (take-home) pay. Budgeting from gross and forgetting taxes is a common mistake that leaves people short each month.',
      },
      {
        q: 'What is a sinking fund?',
        options: [
          'An emergency fund for unexpected expenses',
          'Savings set aside specifically for a known future expense',
          'A fund that loses value over time',
          'A business loan',
        ],
        answer: 1,
        explanation: 'Sinking funds are for PLANNED expenses: car insurance, vacation, holiday gifts. Save $X/month for 6 months so the bill doesn\'t shock you.',
      },
      {
        q: 'What is lifestyle inflation?',
        options: [
          'Prices increasing due to inflation',
          'Increasing your spending as your income increases, preventing wealth accumulation',
          'Buying luxury items occasionally',
          'Living beyond your means',
        ],
        answer: 1,
        explanation: 'Every raise is an opportunity: lifestyle inflation spends it all; wealth-builders save/invest the difference. A $10K raise invested for 30 years > a nicer car.',
      },
      {
        q: 'What is zero-based budgeting?',
        options: [
          'Having zero money left in your account',
          'Assigning every dollar of income a specific purpose so income minus expenses equals zero',
          'Starting a budget from scratch each year',
          'Only spending cash — never using credit',
        ],
        answer: 1,
        explanation: 'Zero-based means every dollar has a "job." If you earn $3,000: $1,500 needs + $600 wants + $900 savings = $3,000. Nothing unaccounted for.',
      },
      {
        q: 'What is a 401(k)?',
        options: [
          'A type of savings account at a bank',
          'An employer-sponsored retirement account with tax advantages',
          'A government pension plan',
          'A type of investment fund',
        ],
        answer: 1,
        explanation: 'A 401(k) lets you invest pre-tax dollars for retirement. Many employers match contributions — free money. Always contribute enough to get the full match first.',
      },
      {
        q: 'What percentage of income should go toward housing costs (rent/mortgage)?',
        options: ['Up to 10%', 'Up to 20%', 'Up to 30%', 'Up to 50%'],
        answer: 2,
        explanation: 'The common "30% rule": housing should not exceed 30% of gross income. In expensive cities this is hard, but exceeding it leaves less for savings and other essentials.',
      },
    ],
  },

  // ── CREDIT & BORROWING ───────────────────────────────────────────
  credit: {
    young: [
      {
        q: 'What is a credit score?',
        options: [
          'Your grade in math class',
          'A number that shows how trustworthy you are with borrowed money',
          'How much money you have saved',
          'The price of something you want to buy',
        ],
        answer: 1,
        explanation: 'A credit score tells lenders how likely you are to pay back money you borrow. A high score = more trust = better deals!',
      },
      {
        q: 'What is "borrowing money"?',
        options: [
          'Finding money on the street',
          'Using someone else\'s money that you promise to pay back later',
          'Earning money from a job',
          'Saving money in a bank',
        ],
        answer: 1,
        explanation: 'When you borrow, you get money now but must pay it back — usually with extra money called "interest" as the cost of borrowing.',
      },
      {
        q: 'Which habit HELPS your credit score?',
        options: [
          'Borrowing money and not paying it back',
          'Always paying back what you borrow on time',
          'Borrowing as much money as possible',
          'Never borrowing any money ever',
        ],
        answer: 1,
        explanation: 'Paying back on time, every time, is the #1 way to build a great credit score. Lenders love reliability!',
      },
      {
        q: 'Why is a good credit score useful?',
        options: [
          'It helps you win video games',
          'It helps you get loans for big things like a car at lower interest rates',
          'It gives you free money',
          'It lets you skip paying taxes',
        ],
        answer: 1,
        explanation: 'A good credit score saves you real money. A person with an excellent score might pay 3% interest on a car loan; poor credit could mean 15%+.',
      },
      {
        q: 'What happens if you borrow money and don\'t pay it back?',
        options: [
          'Nothing bad happens',
          'Your credit score drops and it becomes harder to borrow in the future',
          'The lender forgets about it',
          'You earn more money',
        ],
        answer: 1,
        explanation: 'Missed payments stay on your credit report for 7 years. It becomes hard to get loans, rent an apartment, or sometimes even get a job.',
      },
      {
        q: 'What is "interest" on a loan?',
        options: [
          'Free money the bank gives you',
          'The extra money you pay back for the privilege of borrowing',
          'A type of savings reward',
          'Money you earn from investments',
        ],
        answer: 1,
        explanation: 'Interest is the "rental fee" for borrowed money. If you borrow $100 at 10% interest, you pay back $110. Higher credit score = lower interest rate.',
      },
    ],
    intermediate: [
      {
        q: 'What range do FICO credit scores span?',
        options: ['0–100', '300–850', '500–1000', '1–10'],
        answer: 1,
        explanation: '300 = very poor, 850 = exceptional. Most lenders see 670+ as "good." A difference of 50 points can mean thousands of dollars in interest over a lifetime.',
      },
      {
        q: 'What is the MOST important factor in a FICO score?',
        options: ['How much credit you have available', 'Payment history (paying on time)', 'How many credit cards you own', 'Your income level'],
        answer: 1,
        explanation: 'Payment history = 35% of your FICO score. One missed payment can drop your score 50–100 points and stays on your report for 7 years.',
      },
      {
        q: 'What is "credit utilization"?',
        options: [
          'How often you use your credit card',
          'The percentage of your available credit you\'re currently using',
          'Your total credit limit across all cards',
          'How long you\'ve had your credit card',
        ],
        answer: 1,
        explanation: 'If your limit is $1,000 and you owe $300, utilization = 30%. Keep it below 30% for a good score; below 10% for excellent. It\'s 30% of your FICO score.',
      },
      {
        q: 'What credit score range is considered "Good"?',
        options: ['300–579', '580–669', '670–739', '800–850'],
        answer: 2,
        explanation: 'Ranges: Poor (300-579), Fair (580-669), Good (670-739), Very Good (740-799), Exceptional (800-850). "Good" opens most loan products at reasonable rates.',
      },
      {
        q: 'Why does a longer credit history help your score?',
        options: [
          'It doesn\'t — only recent activity matters',
          'It shows lenders a consistent track record of responsible behavior over time',
          'Older accounts earn higher interest',
          'It increases your credit limit automatically',
        ],
        answer: 1,
        explanation: 'Credit history length = 15% of FICO score. This is why you should keep your oldest credit card open even if you don\'t use it — closing it shortens your history.',
      },
      {
        q: 'How does checking your own credit score affect it?',
        options: [
          'It lowers your score each time',
          'It raises your score',
          'It has no effect — this is a "soft inquiry"',
          'It removes negative items',
        ],
        answer: 2,
        explanation: 'Checking your OWN score = soft inquiry = no impact. Hard inquiries (lenders checking when you apply for credit) can drop your score slightly for up to a year.',
      },
    ],
    teen: [
      {
        q: 'What is the biggest factor in your FICO credit score?',
        options: [
          'Credit utilization (30%)',
          'Payment history (35%)',
          'Length of credit history (15%)',
          'New credit inquiries (10%)',
        ],
        answer: 1,
        explanation: 'FICO breakdown: Payment history 35%, Utilization 30%, History length 15%, Credit mix 10%, New credit 10%. Pay on time, every time — it\'s the single biggest lever.',
      },
      {
        q: 'What is an ideal credit utilization ratio for the best score impact?',
        options: ['Below 30%', 'Below 10%', 'Below 50%', 'Exactly 0%'],
        answer: 1,
        explanation: 'Under 10% is optimal. Under 30% is acceptable. 0% can actually slightly hurt because it shows no active usage. Charge small amounts and pay them off monthly.',
      },
      {
        q: 'What is a "hard inquiry" on your credit report?',
        options: [
          'When you check your own credit score',
          'When a lender pulls your credit during a loan application',
          'When a credit bureau updates your report',
          'When you dispute an error on your report',
        ],
        answer: 1,
        explanation: 'Hard inquiries happen when you apply for credit. Each can drop your score 5–10 points temporarily. Multiple applications in 14–45 days for the same loan type count as one.',
      },
      {
        q: 'What is a "secured credit card" and why is it useful for building credit?',
        options: [
          'A card with extra fraud protection',
          'A card backed by a cash deposit you make, ideal for starting your credit history',
          'A card only usable at specific stores',
          'A card with no interest rate',
        ],
        answer: 1,
        explanation: 'Secured cards require a deposit (e.g. $200 deposit = $200 limit). They report to credit bureaus like regular cards. Ideal for building history from scratch at 18.',
      },
      {
        q: 'How long does a negative item (missed payment) stay on your credit report?',
        options: ['1 year', '3 years', '7 years', '10 years'],
        answer: 2,
        explanation: 'Most negative items stay 7 years. Chapter 7 bankruptcy stays 10 years. This is why one financial mistake at 18 can affect you until 25 — context for being careful early.',
      },
      {
        q: 'What is the "thin file" problem?',
        options: [
          'Having too many credit accounts',
          'Having too little credit history for bureaus to generate a score',
          'Having accounts in good standing',
          'Using your credit card too infrequently',
        ],
        answer: 1,
        explanation: 'With fewer than 3–6 months of credit history, you may have no score at all. Solutions: become an authorized user on a parent\'s card, or open a secured card at 18.',
      },
    ],
  },

  // ── SAVING & INTEREST ────────────────────────────────────────────
  savings: {
    young: [
      {
        q: 'What is interest from a bank?',
        options: [
          'Money you pay to keep your money at a bank',
          'Bonus money the bank gives you for keeping your savings there',
          'A fee for using a debit card',
          'The amount you spend each month',
        ],
        answer: 1,
        explanation: 'Banks use your money to lend to others. As a thank you, they share some of their earnings with you as interest — free money for saving!',
      },
      {
        q: 'If you save $50 and earn 10% interest, how much interest do you earn?',
        options: ['$1', '$5', '$10', '$50'],
        answer: 1,
        explanation: '10% of $50 = $5. Your total becomes $55. Next year, if you earn 10% on $55, you earn $5.50 — interest on your interest! That\'s compound interest.',
      },
      {
        q: 'Who grows their money faster — someone who starts saving at age 5 or age 15?',
        options: [
          'Age 15, because they\'re older',
          'They grow at the same speed',
          'Age 5, because their money has more time to grow',
          'Neither — savings don\'t grow',
        ],
        answer: 2,
        explanation: 'Time is money\'s superpower! Starting at 5 means 10 extra years of growth. $100 at 7% for 40 years = $1,497. For 30 years = $761. Ten years makes a huge difference!',
      },
      {
        q: 'What is "compound interest"?',
        options: [
          'Interest that\'s very complicated to calculate',
          'Interest you earn on your interest — your money grows faster and faster',
          'Two types of interest at once',
          'Interest from two different banks',
        ],
        answer: 1,
        explanation: 'Compound interest is interest earning interest. Year 1: earn $10. Year 2: earn interest on $110 (not just $100). It snowballs — Einstein called it the 8th wonder of the world!',
      },
      {
        q: 'Which earns MORE over 10 years: $100 under your mattress or $100 in a savings account?',
        options: [
          'Under your mattress — it\'s safer',
          'In a savings account — it earns interest',
          'They earn the same',
          'Under your mattress — banks can lose it',
        ],
        answer: 1,
        explanation: '$100 at 5% for 10 years = $163. Under the mattress = still $100, but worth LESS due to inflation. Money not growing is money slowly shrinking!',
      },
      {
        q: 'What is a good saving goal to have?',
        options: [
          'Save only if there\'s money left after spending',
          'Have a specific target like "save $50 for a new game"',
          'Keep all your money and never spend any',
          'Spend all your money so others can\'t take it',
        ],
        answer: 1,
        explanation: 'Goals make saving real! "Save $50 for a game in 5 weeks = $10/week" is way more motivating than vague saving. Specific goals = specific progress.',
      },
    ],
    intermediate: [
      {
        q: 'What is compound interest?',
        options: [
          'Interest only on the original amount you deposited',
          'Interest earned on both your original deposit AND the interest already accumulated',
          'Two interest rates applied at once',
          'Interest that decreases over time',
        ],
        answer: 1,
        explanation: 'Compound interest = interest on interest. $1,000 at 7%/yr: Year 1 earns $70. Year 2 earns 7% on $1,070 = $74.90. The growth accelerates over time.',
      },
      {
        q: 'What is the "Rule of 72"?',
        options: [
          'Always save 72% of your income',
          'Divide 72 by your interest rate to estimate how many years to double your money',
          'Keep 72 dollars in cash at all times',
          'Invest for 72 months to guarantee a return',
        ],
        answer: 1,
        explanation: 'At 7% return: 72 ÷ 7 = ~10.3 years to double. At 6%: 12 years. At 9%: 8 years. A fast mental math shortcut every investor should know.',
      },
      {
        q: 'Which earns more total interest — compounding monthly or compounding yearly at the same rate?',
        options: [
          'Yearly compounding earns more',
          'Monthly compounding earns more, because interest is added and starts growing sooner',
          'They always earn the same',
          'It depends on the amount saved',
        ],
        answer: 1,
        explanation: 'Monthly compounding adds interest 12× per year. Each addition immediately starts earning. 5% compounded monthly ≈ 5.12% APY — more than 5% compounded yearly.',
      },
      {
        q: 'What is the difference between APR and APY?',
        options: [
          'They are the same thing with different names',
          'APR = Annual Percentage Rate (ignores compounding); APY = Annual Percentage Yield (includes compounding effects)',
          'APR is for savings; APY is for loans',
          'APR is higher; APY is lower',
        ],
        answer: 1,
        explanation: 'Always compare APY when evaluating savings accounts — it tells you the TRUE annual return including compounding. APR understates growth.',
      },
      {
        q: 'What is a high-yield savings account?',
        options: [
          'A savings account at a big bank with the highest rates',
          'An online savings account earning significantly more than a standard account',
          'A savings account with no minimum balance',
          'A CD (certificate of deposit)',
        ],
        answer: 1,
        explanation: 'HYSAs (often at online banks) earn 4-5%+ vs. 0.01-0.1% at traditional banks. Same FDIC insurance. Moving savings here is one of the easiest financial wins.',
      },
      {
        q: 'What is "simple interest" vs. "compound interest"?',
        options: [
          'Simple is harder to understand; compound is easier',
          'Simple earns interest only on principal; compound earns interest on principal AND accumulated interest',
          'They always give the same result',
          'Simple applies to savings; compound only to loans',
        ],
        answer: 1,
        explanation: 'Simple: $1,000 × 5% = $50/year, every year. After 10 years: $1,500. Compound: Year 1 = $50, Year 2 = $52.50, growing each year. After 10 years: $1,629. The gap widens dramatically over time.',
      },
    ],
    teen: [
      {
        q: 'What is the "real rate of return"?',
        options: [
          'The advertised interest rate on a savings account',
          'Your nominal return minus the inflation rate',
          'The return after taxes only',
          'The highest rate you can find',
        ],
        answer: 1,
        explanation: 'If your savings earn 4% but inflation is 3%, your real return is only 1%. Money in accounts earning below inflation is LOSING purchasing power each year.',
      },
      {
        q: 'At 3% inflation, what is $1,000 in today\'s dollars worth in 10 years?',
        options: ['$1,300', '$1,000', '~$744', '~$1,130'],
        answer: 2,
        explanation: 'Inflation erodes purchasing power: $1,000 × (1 − 0.03)^10 ≈ $744. This is why keeping large sums in low-yield accounts or cash long-term destroys wealth.',
      },
      {
        q: 'What makes tax-advantaged accounts (IRA, 401k) so powerful?',
        options: [
          'They earn higher interest rates automatically',
          'Investments grow without being taxed annually, compounding faster than taxable accounts',
          'The government contributes to them',
          'They are guaranteed to never lose value',
        ],
        answer: 1,
        explanation: 'In a taxable account, gains taxed annually slow compounding. In a Roth IRA, growth is completely tax-free. $1,000 growing at 7% for 30 years: taxable ≈ $5,743; Roth ≈ $7,612.',
      },
      {
        q: 'What is the maximum annual Roth IRA contribution limit (as of 2024) for under-50s?',
        options: ['$3,000', '$6,500', '$7,000', '$19,500'],
        answer: 2,
        explanation: '$7,000/year for 2024 (up from $6,500 in 2023). Max this out every year from age 20, invest in index funds, and you\'ll likely retire a millionaire from the IRA alone.',
      },
      {
        q: 'What is "sequence of returns risk"?',
        options: [
          'The risk of investing in stocks in the wrong order',
          'The risk that poor returns early in retirement can devastate a portfolio even if long-term averages are fine',
          'The risk of interest rates rising when you hold bonds',
          'The risk of receiving dividends in a bad sequence',
        ],
        answer: 1,
        explanation: 'Retiring just before a crash (like 2008) and withdrawing during it depletes capital permanently. Same average returns, different sequence = vastly different outcomes.',
      },
      {
        q: 'Why is starting to invest at 20 vs. 30 so dramatically different?',
        options: [
          'It isn\'t — the difference is small',
          'Ten extra years of compounding at 7% nearly doubles the final amount',
          'Tax rates are lower when you\'re younger',
          'Investment minimums are lower for younger people',
        ],
        answer: 1,
        explanation: '$5,000/yr from 20–30, then stop = ~$602K at 65. $5,000/yr from 30–65 = ~$758K. Investing for only 10 years early beats 35 years later. Time is the most valuable asset.',
      },
    ],
  },

  // ── MONEY MARKETS ───────────────────────────────────────────────
  markets: {
    young: [
      {
        q: 'What is interest?',
        options: ['A type of toy', 'Free money you earn for saving', 'Money you owe', 'A game'],
        answer: 1,
        explanation: 'Interest is bonus money the bank gives you as a reward for keeping your savings there!',
      },
      {
        q: 'Where is the SAFEST place to keep your money?',
        options: ['Under your pillow', 'In a bank', 'In your backpack', 'In a jar outside'],
        answer: 1,
        explanation: 'Banks protect your money and even grow it with interest. The government insures bank accounts too!',
      },
      {
        q: 'What does a bank do with your money?',
        options: ['Throws it away', 'Keeps it in a pile forever', 'Lends it to others and pays you interest', 'Spends it on toys'],
        answer: 2,
        explanation: 'Banks lend your money to other people and share some of that profit with you as interest!',
      },
      {
        q: 'If you save $10 and earn 10% interest, how much do you have?',
        options: ['$10', '$11', '$20', '$9'],
        answer: 1,
        explanation: '10% of $10 = $1. So $10 + $1 = $11! That\'s how interest works!',
      },
      {
        q: 'What is a savings account?',
        options: [
          'A place where you store toys',
          'A bank account that keeps your money safe and earns interest',
          'A type of credit card',
          'An app on your phone',
        ],
        answer: 1,
        explanation: 'A savings account is one of the safest places to keep money — the bank protects it and pays you interest for keeping it there.',
      },
      {
        q: 'Which is smarter with your allowance?',
        options: ['Spend it all right away', 'Save some of it', 'Lose it', 'Give it all away'],
        answer: 1,
        explanation: 'Saving some of your money means you\'ll have it for important things later — and it grows with interest!',
      },
    ],
    intermediate: [
      {
        q: 'What is a money market account?',
        options: [
          'A place to buy stocks',
          'A high-interest savings account for larger balances',
          'A type of insurance',
          'A loan from a bank',
        ],
        answer: 1,
        explanation: 'Money market accounts typically pay higher interest than regular savings accounts but may require a higher minimum balance.',
      },
      {
        q: 'What does "liquid" mean when talking about money?',
        options: [
          'Money that gets wet',
          'Money you can access quickly without penalty',
          'Money invested in stocks',
          'Money you owe',
        ],
        answer: 1,
        explanation: 'Liquid assets convert to cash quickly. Savings accounts are liquid; real estate is not.',
      },
      {
        q: 'What is a Certificate of Deposit (CD)?',
        options: [
          'A music disc',
          'A savings account where you lock money for a fixed time for higher interest',
          'A stock certificate',
          'A type of loan',
        ],
        answer: 1,
        explanation: 'CDs pay higher interest because you agree to leave your money untouched for a set period (3 months to 5 years). Early withdrawal = penalty.',
      },
      {
        q: 'Compound interest is different from simple interest because:',
        options: [
          'It\'s always lower',
          'It\'s harder to calculate',
          'Your interest earns interest too — snowballing over time',
          'It only applies to loans',
        ],
        answer: 2,
        explanation: 'With compound interest, the interest you earn gets added to your balance, and then that total earns even more interest!',
      },
      {
        q: 'Which typically earns the MOST interest?',
        options: [
          'Money under a mattress',
          'Regular checking account',
          'High-yield savings or money market account',
          'Gift cards',
        ],
        answer: 2,
        explanation: 'HYSAs and money market accounts earn significantly more — sometimes 10–20× more than a standard checking account!',
      },
      {
        q: 'What does FDIC insurance mean for your bank account?',
        options: [
          'Your account earns a guaranteed interest rate',
          'The government insures your deposits up to $250,000 if the bank fails',
          'Your account is protected from fraud only',
          'The bank pays higher interest if it makes bad investments',
        ],
        answer: 1,
        explanation: 'FDIC insures $250,000 per depositor per bank. This is why bank savings are "safe" — even if the bank fails, you get your money back (up to the limit).',
      },
    ],
    teen: [
      {
        q: 'What is a money market FUND (vs. account)?',
        options: [
          'A savings account at a bank',
          'A mutual fund investing in short-term, low-risk securities like T-bills — NOT FDIC insured',
          'A stock index fund',
          'A long-term government bond',
        ],
        answer: 1,
        explanation: 'Money market funds are investment products, not bank accounts. They\'re very safe (near-zero volatility) but not FDIC insured. They typically yield slightly more than HYSAs.',
      },
      {
        q: 'What are Treasury bills (T-bills)?',
        options: [
          'Stocks issued by the government',
          'Short-term US government debt maturing in under one year — the closest thing to risk-free',
          'Long-term savings bonds',
          'Bank certificates of deposit backed by the government',
        ],
        answer: 1,
        explanation: 'T-bills are the global benchmark for risk-free investment. All other investments are priced relative to T-bill yields. 4-week to 52-week maturities.',
      },
      {
        q: 'What does APY mean and how does it differ from APR?',
        options: [
          'APY = Annual Percentage Yield; includes compounding, so always ≥ APR',
          'APY = Average Profit per Year; same as APR',
          'APY and APR are interchangeable',
          'APY = Asset Protection Yield; only for secured accounts',
        ],
        answer: 0,
        explanation: 'A 5% APR compounded monthly gives APY of ~5.12%. Always compare APY across savings products — it\'s the honest number.',
      },
      {
        q: 'An inverted yield curve (short-term rates > long-term rates) typically signals:',
        options: [
          'A booming economy',
          'Rising stock prices ahead',
          'A potential upcoming recession',
          'Lower inflation ahead',
        ],
        answer: 2,
        explanation: 'An inverted yield curve has preceded every US recession since WWII. It signals investors expect economic slowdown → lower future rates → they lock in current long-term rates.',
      },
      {
        q: 'What is the federal funds rate and why does it matter to savers?',
        options: [
          'The rate banks charge each other for overnight loans — it sets the floor for all interest rates',
          'The rate the government charges for tax refunds',
          'The rate at which the government prints money',
          'The standard interest rate for mortgages',
        ],
        answer: 0,
        explanation: 'When the Fed raises the federal funds rate, HYSA and money market rates rise too. When it cuts rates, savings rates fall. 2022-2023 rate hikes drove savings rates from 0.01% to 5%+.',
      },
      {
        q: 'What is the bid-ask spread, and why does it matter to active traders?',
        options: [
          'The difference between a stock\'s buy price and sell price — a hidden trading cost',
          'The gap between a company\'s earnings and its market cap',
          'The difference between APR and APY',
          'A fee charged by brokers for placing orders',
        ],
        answer: 0,
        explanation: 'Bid = what buyers will pay; Ask = what sellers want. The spread is a transaction cost. On liquid stocks it\'s pennies; on illiquid stocks it can be 1%+. Day traders pay it on every round-trip.',
      },
    ],
  },
};
