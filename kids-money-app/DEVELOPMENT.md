# Development Guide

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone or navigate to the project
cd Kids\ Money\ App

# Install dependencies
npm install

# Start development server
npm start
```

The app opens at `http://localhost:3000` with hot reload enabled.

## Architecture

### Component Structure

```
App (root)
├── Navigation
├── Dashboard
│   ├── PortfolioSummary
│   └── QuickStats
├── Trading
│   └── StockCard (multiple)
├── Portfolio
│   ├── HoldingsTable
│   └── TransactionHistory
└── Lessons
    └── LessonCard (multiple)
```

### State Management

Uses React Context API with `PortfolioContext`:

```javascript
// Access portfolio state anywhere:
const { portfolio, stocks, buyStock, sellStock } = usePortfolio();
```

**Context provides:**
- `portfolio` - User's cash, holdings, transactions
- `stocks` - Current stock prices and changes
- `buyStock(stockId, quantity)` - Buy stocks
- `sellStock(stockId, quantity)` - Sell stocks
- `getPortfolioValue()` - Calculate total value

### Data Flow

```
User Action (Buy/Sell)
    ↓
StockCard Component
    ↓
usePortfolio Hook
    ↓
PortfolioContext Reducer
    ↓
localStorage Persistence
    ↓
Component Re-render
```

## Adding Features

### 1. Add a New Stock

Edit `src/context/PortfolioContext.jsx`:

```javascript
const FICTIONAL_STOCKS = [
  // ... existing stocks
  { id: 'TECH', name: 'Tech World Inc.', price: 85.25, change: 1.5 },
];
```

### 2. Create a New Page

1. Create file: `src/pages/YourPage.jsx`
2. Add route in `src/App.jsx`:

```javascript
<Route path="/your-path" element={<YourPage userAge={userAge} />} />
```

3. Add navigation link in `src/components/Navigation.jsx`

### 3. Add a New Component

1. Create file: `src/components/YourComponent.jsx`
2. Create styles: `src/styles/YourComponent.css`
3. Import and use in pages

Example:

```javascript
import React from 'react';
import '../styles/YourComponent.css';

function YourComponent({ userAge }) {
  const isYoung = userAge < 8;
  
  return (
    <div className="your-component">
      {isYoung ? <p>Big text for kids</p> : <p>Normal text</p>}
    </div>
  );
}

export default YourComponent;
```

### 4. Add Age-Appropriate Content

Always check user age:

```javascript
const isYoung = userAge < 8;
const isTeen = userAge >= 13;

return (
  <div>
    {isYoung && <div>Content for young kids</div>}
    {!isYoung && isTeen && <div>Advanced content</div>}
    {!isYoung && !isTeen && <div>Intermediate content</div>}
  </div>
);
```

## Styling Guide

### Color Scheme

- **Primary**: `#667eea` (Purple)
- **Secondary**: `#764ba2` (Dark Purple)
- **Success**: `#4caf50` (Green) - for gains
- **Danger**: `#f44336` (Red) - for losses
- **Info**: `#2196F3` (Blue)
- **Background**: `#f5f7ff` (Light blue)

### Responsive Breakpoints

```css
/* Desktop: 1200px+ */
/* Tablet: 768px - 1199px */
/* Mobile: < 768px */

@media (max-width: 768px) {
  /* Mobile styles */
}
```

### CSS Classes

Follow BEM naming convention:

```css
/* Block */
.stock-card { }

/* Element */
.stock-card__header { }

/* Modifier */
.stock-card--expanded { }
```

## Testing

### Unit Tests Example

```javascript
// src/__tests__/PortfolioContext.test.js
import { render, screen } from '@testing-library/react';
import { PortfolioProvider } from '../context/PortfolioContext';

test('initial portfolio has $10,000', () => {
  render(
    <PortfolioProvider>
      <TestComponent />
    </PortfolioProvider>
  );
  
  expect(screen.getByText(/10000/)).toBeInTheDocument();
});
```

Run tests:
```bash
npm test
```

## Git Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/new-feature
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push to repository:
   ```bash
   git push origin feature/new-feature
   ```

4. Create Pull Request

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat: add stock watchlist

Users can now mark stocks as favorites for quick access.

Fixes #123
```

## Performance Optimization

### Code Splitting

Lazy load pages:

```javascript
import { lazy, Suspense } from 'react';

const Trading = lazy(() => import('./pages/Trading'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Trading />
    </Suspense>
  );
}
```

### Memoization

Prevent unnecessary re-renders:

```javascript
const StockCard = React.memo(({ stock, onBuy }) => {
  // Component only re-renders if props change
  return <div>...</div>;
});
```

### useCallback

Memoize callback functions:

```javascript
const handleBuy = useCallback((stockId, quantity) => {
  buyStock(stockId, quantity);
}, [buyStock]);
```

## Debugging

### Browser DevTools

1. Open DevTools: F12 (Windows) or Cmd+Option+I (Mac)
2. Check Console tab for errors
3. Use React DevTools tab to inspect components

### React DevTools

Install browser extension:
- Chrome: React Developer Tools
- Firefox: React Developer Tools

Inspect component state and props in real-time.

### Logging

```javascript
console.log('Portfolio:', portfolio);
console.error('Error buying stock:', error);
console.warn('Price spike detected');
```

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `build/` folder:
- Minified JS/CSS
- Code splitting
- Source maps for debugging
- Optimized images

Test the build locally:
```bash
npm install -g serve
serve -s build
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Auto-deploys on push

### Self-hosted

1. Build the app: `npm run build`
2. Copy `build/` folder to server
3. Serve with any web server (Nginx, Apache, etc.)

## Common Issues & Solutions

### Issue: Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### Issue: localStorage not working
Check browser settings for incognito/private mode. These disable localStorage.

### Issue: Components not updating
- Check if using `useCallback` or `useMemo` correctly
- Verify context provider wraps all components
- Check React DevTools for unexpected state changes

### Issue: Styles not applying
- Check CSS specificity
- Clear browser cache (Ctrl+Shift+Delete)
- Verify import path is correct

## Resources

- [React Documentation](https://react.dev)
- [React Router Guide](https://reactrouter.com)
- [Context API Tutorial](https://react.dev/learn/scaling-up-with-reducer-and-context)
- [CSS-Tricks](https://css-tricks.com)
- [MDN Web Docs](https://developer.mozilla.org)

## Code Style

Use ESLint and Prettier for consistent code:

```bash
npm install --save-dev eslint prettier
npx eslint .
npx prettier --write .
```

### Style Guidelines

- Use functional components with hooks
- Destructure props at function parameters
- Name events as `handleEventName`
- Use meaningful variable names
- Add comments for complex logic
- Keep components under 300 lines

## Next Steps

1. Set up your development environment
2. Create a feature branch
3. Make changes
4. Test thoroughly
5. Submit a pull request
6. Get feedback and iterate

Happy coding! 🚀
