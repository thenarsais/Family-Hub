# Quick Start Guide

## Installation (5 minutes)

```bash
cd "Kids Money App"
npm install
npm start
```

That's it! The app opens at `http://localhost:3000`.

## What You Get

✅ **React Web App** for teaching kids about money and stocks
✅ **Age-Adaptive UI** (automatic scaling from 5-18 years old)
✅ **Paper Trading** with fictional stocks
✅ **Portfolio Tracking** with gains/losses
✅ **Educational Lessons** at 3 complexity levels
✅ **Home Assistant Integration** ready
✅ **Mobile Responsive** design
✅ **Data Persistence** via localStorage

## Project Structure

```
Kids Money App/
├── public/              # Static files
│   └── index.html       # App entry point
├── src/
│   ├── components/      # UI components
│   ├── pages/           # App pages (Dashboard, Trading, etc)
│   ├── styles/          # CSS files
│   ├── context/         # State management
│   ├── App.jsx          # Main component
│   └── index.jsx        # React root
├── package.json         # Dependencies
└── README.md           # Full documentation
```

## Key Features

### 1. Dashboard
Shows portfolio summary, gains/losses, and quick stats.

### 2. Trading
Buy and sell fictional stocks:
- Pizza Palace Inc. (PIZZA)
- Game Master Co. (GAMES)  
- Sweet Treats Ltd. (CANDY)
- Story World Inc. (BOOKS)
- Toy Kingdom Co. (TOYS)

### 3. Portfolio
View all holdings and transaction history.

### 4. Lessons
Age-appropriate financial education:
- **Ages 5-7**: What is money? Saving vs spending
- **Ages 8-12**: What are stocks? How banks work
- **Ages 13+**: Market analysis, diversification, compound interest

## How It Works

1. **Start with $10,000** in virtual cash
2. **Buy stocks** you think will go up
3. **Watch prices change** every 30 seconds (±2% randomness)
4. **Sell for profit** when prices rise
5. **Track your gains** on the dashboard
6. **Learn from lessons** at each age level

## File Tree

Important files to know:

```
Context (State):
  src/context/PortfolioContext.jsx
  └─ Manages portfolio, stocks, buy/sell logic

Pages:
  src/pages/Dashboard.jsx      → Home page
  src/pages/Trading.jsx        → Buy/sell interface
  src/pages/Portfolio.jsx      → Holdings view
  src/pages/Lessons.jsx        → Education content

Components:
  src/components/Navigation.jsx
  src/components/StockCard.jsx
  src/components/PortfolioSummary.jsx
  etc...

Styling:
  src/App.css                  → Global styles
  src/styles/*.css             → Component styles

Config:
  package.json                 → Dependencies & scripts
  public/index.html            → HTML root
```

## Common Tasks

### Change User Age
The app detects age from `localStorage.getItem('userAge')`. 
Open console and run:
```javascript
localStorage.setItem('userAge', 10);
location.reload();
```

### Add a New Stock
Edit `src/context/PortfolioContext.jsx`:
```javascript
{ id: 'TECH', name: 'Tech Inc.', price: 99.99, change: 2.5 },
```

### Add a Lesson
Edit `src/pages/Lessons.jsx` and add to the LESSONS object.

### Change Colors
Edit `src/App.css` and update color variables:
```css
#667eea  /* Primary purple */
#764ba2  /* Secondary dark purple */
#4caf50  /* Success green */
#f44336  /* Danger red */
```

## Available Commands

```bash
npm start       # Development server (hot reload)
npm build       # Production build
npm test        # Run tests
npm eject       # Advanced: eject from Create React App
```

## Home Assistant Integration

See `HOME_ASSISTANT_INTEGRATION.md` for detailed setup.

Quick overview:
- Copy `build/` folder to Home Assistant
- Create custom card/panel
- Display portfolio data on Family Hub

## Customization Ideas

- [ ] Add real stock data (Alpha Vantage API)
- [ ] Create achievements/badges
- [ ] Add stock watchlist
- [ ] Build performance charts
- [ ] Multi-user support
- [ ] Leaderboards
- [ ] Notifications for price changes
- [ ] News feed integration

## Troubleshooting

**Port 3000 in use?**
```bash
PORT=3001 npm start
```

**Blank screen?**
- Check browser console (F12)
- Clear cache: Ctrl+Shift+Delete
- Restart dev server: Ctrl+C, then `npm start`

**localStorage not persisting?**
- Check if in incognito mode (it disables localStorage)
- Check browser privacy settings

**Styles look weird?**
- Clear cache and reload
- Check if CSS files are imported correctly

## Next Steps

1. ✅ Installation complete
2. 🎨 Customize colors and content
3. 📚 Add more lessons or stocks
4. 🏠 Set up Home Assistant integration
5. 🚀 Deploy to production

## Where to Go From Here

- **Modify**: Edit components in `src/` to customize
- **Learn**: Read `DEVELOPMENT.md` for deeper understanding
- **Integrate**: Check `HOME_ASSISTANT_INTEGRATION.md`
- **Deploy**: Use `npm run build` then deploy `build/` folder

## Support

- Check `README.md` for full documentation
- Read `DEVELOPMENT.md` for code guidelines
- See `HOME_ASSISTANT_INTEGRATION.md` for HA setup

---

**You're all set!** 🚀 Start customizing and building. Happy coding!
