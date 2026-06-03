# Kids Money App 💰

An educational React web app that teaches children about money management and stock trading through a simulated investment experience. Designed for ages 5-18 with age-appropriate UI and content.

## Features

- **Age-Adaptive Interface** - Content and complexity scale with user age (5-18)
- **Paper Trading** - Simulate stock trading with fictional stocks
- **Portfolio Tracking** - Monitor holdings, cash, portfolio value, and performance chart
- **Credit Score Simulator** - Live score derived from trading behavior (FICO scale for teens)
- **Budget & Income Tracker** - Log allowance, chores, jobs, gifts, and expenses by category
- **Compound Interest Calculator** - Interactive sliders with year-by-year breakdown
- **Money Markets Quiz** - Age-gated questions with explanations and score tracking
- **Interactive Lessons** - Age-appropriate financial education modules
- **Transaction History** - View all buy/sell activity
- **Home Assistant Integration** - Display portfolio data on Family Hub dashboard
- **Responsive Design** - Mobile-friendly interface

## Getting Started

### Installation

```bash
npm install
npm start
```

The app runs on `http://localhost:3000`.

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Navigation.jsx
│   ├── StockCard.jsx
│   ├── PortfolioSummary.jsx
│   ├── QuickStats.jsx
│   ├── HoldingsTable.jsx
│   ├── TransactionHistory.jsx
│   ├── LessonCard.jsx
│   └── PortfolioChart.jsx   # SVG performance chart
├── pages/               # Main page components
│   ├── Dashboard.jsx    # Home/overview with chart
│   ├── Trading.jsx      # Buy/sell stocks
│   ├── Portfolio.jsx    # Holdings & transactions
│   ├── Lessons.jsx      # Financial education
│   ├── CreditScore.jsx  # Credit score simulator
│   ├── Budget.jsx       # Income & expense tracker
│   ├── Calculator.jsx   # Compound interest calculator
│   └── Quiz.jsx         # Money markets quiz
├── context/             # State management
│   ├── PortfolioContext.jsx  # Trading state + value history
│   └── BudgetContext.jsx     # Income/expense state
├── hooks/
│   └── useCreditScore.js    # Derives credit score from portfolio
├── styles/              # Component CSS files
├── App.jsx              # Main app component
└── index.jsx            # React entry point
```

## Features Overview

### Dashboard
Real-time portfolio summary showing:
- Total portfolio value
- Gain/loss and percentage
- Available cash
- Quick stats (shares owned, companies, transactions)

### Trading
Buy and sell fictional stocks:
- 5 fictional companies (Pizza Palace, Game Master, etc.)
- Real-time price simulation
- Quantity selector for trades
- Immediate feedback on transactions

### Portfolio
View current holdings and transaction history:
- Holdings table with current values
- Transaction ledger (last 10 trades)
- Portfolio breakdown

### Lessons
Age-appropriate financial lessons:
- Ages 5-7: Basic money concepts
- Ages 8-12: Stock basics and investing
- Ages 13+: Advanced strategies and analysis

## Age-Appropriate Design

The app automatically adjusts for different age groups:

**Ages 5-7** (Young learners)
- Larger buttons and text
- Colorful emojis and icons
- Simplified language
- Simple buy/sell interface
- Focus on fundamentals

**Ages 8-12** (Intermediate)
- Standard button sizes
- More detailed explanations
- Stock price movements
- Portfolio tracking

**Ages 13+** (Advanced)
- Professional dashboard
- Advanced metrics
- Complex strategies
- Real market concepts

## State Management

Uses React Context API (`PortfolioContext`) for:
- Portfolio holdings and cash
- Transaction history
- Stock prices (simulated with 30-second updates)
- Buy/sell operations

Data persists to localStorage automatically.

## Fictional Stocks

The simulator includes these fictional stocks:
- **PIZZA** - Pizza Palace Inc. ($45.50)
- **GAMES** - Game Master Co. ($62.00)
- **CANDY** - Sweet Treats Ltd. ($38.75)
- **BOOKS** - Story World Inc. ($51.20)
- **TOYS** - Toy Kingdom Co. ($72.40)

Prices fluctuate every 30 seconds ±2% to simulate market movement.

## Home Assistant Integration

### Family Hub Display Card

Create a custom card in Home Assistant to display portfolio data:

```yaml
# configuration.yaml
template:
  - sensor:
      - name: "Kids Portfolio Value"
        unique_id: kids_portfolio_value
        unit_of_measurement: "$"
        state: "{{ states('sensor.wallet_balance') }}"
        
      - name: "Kids Portfolio Gain"
        unique_id: kids_portfolio_gain
        unit_of_measurement: "%"
        state: "{{ states('sensor.portfolio_return') }}"
```

### REST API Integration

Expose the portfolio data via REST API:

```bash
# App needs to support API endpoints:
# GET /api/portfolio - Returns portfolio state
# GET /api/stocks - Returns current stock prices
# POST /api/trade - Execute buy/sell
```

See `HOME_ASSISTANT_INTEGRATION.md` for detailed setup.

## Future Enhancements

- [ ] Real stock data integration (Alpha Vantage, Yahoo Finance)
- [ ] Real money trading (requires brokerage API)
- [ ] Multi-user support with parent controls
- [ ] Achievement badges and gamification
- [ ] Stock watchlist
- [ ] News feed integration
- [ ] Educational video modules
- [ ] Leaderboards
- [ ] Advanced technical analysis

## Technologies

- **React 18** - UI framework
- **React Router** - Navigation
- **TailwindCSS** - Styling (core utilities)
- **Context API** - State management
- **localStorage** - Data persistence

## Development

### Available Scripts

```bash
npm start      # Run development server
npm build      # Create production build
npm test       # Run tests
npm eject      # Eject from Create React App (one-way operation)
```

### Adding New Features

1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update context if state changes needed
4. Add styles in `src/styles/`

### Testing

Add unit tests to verify:
- Portfolio calculations
- Buy/sell logic
- Price updates
- Age-based rendering

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Deploy the 'build' folder
```

### Home Assistant as Home App
Package as a custom frontend panel for full integration.

## License

MIT License - Feel free to use, modify, and distribute.

## Contributing

To add features or fix bugs:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For questions or issues:
- Check existing issues
- Create a new issue with details
- Contact the maintainer

## Roadmap

**Phase 1** ✅
- Basic portfolio tracking
- Paper trading simulator
- Age-adapted lessons
- Credit score simulator

**Phase 2** ✅
- Portfolio performance chart
- Budget & income tracker (allowance, chores, jobs, gifts)
- Compound interest calculator
- Money markets quiz

**Phase 3** ✅
- Age-specific onboarding flows (5–7, 8–12, 13+)
- 3 guided feature tours (Trading, Budget, Credit Score)
- 6 interactive scenario tutorials with real-world lessons

**Phase 4**
- Real stock data (Alpha Vantage / Yahoo Finance)
- Home Assistant full integration
- Multi-user support with parent controls

---

**Start teaching your kids about money today!** 🌟
