# Family Hub - Frontend
## React + TypeScript + Tailwind CSS

**Status:** Ready for Development ✅

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx          # Top navigation bar
│   │   ├── ProtectedRoute.tsx      # Route protection
│   │   └── ...                     # Other components
│   ├── pages/
│   │   ├── Login.tsx               # Login page
│   │   ├── Signup.tsx              # Sign up page
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── ActivityBoard.tsx       # Activity board (20 sections)
│   │   └── NotFound.tsx            # 404 page
│   ├── services/
│   │   └── api.ts                  # API client with all endpoints
│   ├── stores/
│   │   └── authStore.ts            # Auth state (Zustand)
│   ├── hooks/
│   │   └── useAuth.ts              # Auth hook
│   ├── styles/
│   │   └── index.css               # Global styles + Tailwind
│   ├── types/
│   │   └── ...                     # TypeScript types
│   ├── utils/
│   │   └── ...                     # Utility functions
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript config
├── vite.config.ts                  # Vite config
├── tailwind.config.js              # Tailwind config
├── postcss.config.js               # PostCSS config
└── README.md                       # This file
```

---

## 🔧 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🎨 Styling

### Tailwind CSS
Pre-configured with:
- Custom color palette (primary, secondary, success, warning, error)
- Custom spacing and sizing
- Utility classes (btn, card, input, badge, etc.)

### Usage

```tsx
<div className="bg-primary-500 text-white p-4 rounded-lg">
  Primary button styles
</div>
```

---

## 🔐 Authentication

### Login Flow

```typescript
import { useAuth } from '@hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Welcome, {user?.name}!</div>;
}
```

### Token Management

- Token stored in localStorage
- Automatically added to API requests
- Automatically cleared on logout
- Redirects to login on 401

---

## 📡 API Integration

### Using API Client

```typescript
import { apiClient } from '@services/api';

// Get user points
const points = await apiClient.getUserPoints(userId);

// Award badge
await apiClient.awardBadge(userId, badgeId, 'Achievement unlocked!');

// Get leaderboard
const leaderboard = await apiClient.getLeaderboard(10, 'week');
```

### Full API Documentation

See `docs/API-REFERENCE.md` for all 60+ endpoints with examples.

---

## 🎛️ State Management

### Zustand Stores

```typescript
import { useAuthStore } from '@stores/authStore';

function MyComponent() {
  const { user, login, logout } = useAuthStore();
  
  // Use store functions
  await login(email, password);
}
```

**Available Stores:**
- `authStore` - Authentication state and actions

---

## 📱 Components

### Navigation
```tsx
<Navigation /> // Main navigation with user menu
```

### ProtectedRoute
```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### More Components (to be built)
- Dashboard cards
- Activity board sections
- Badge display
- Leaderboard
- User profile
- Settings panel

---

## 🎯 Development Workflow

### 1. Start Backend

```bash
cd backend
npm run dev
```

API runs on `http://localhost:3000`

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`

### 3. Development

- API proxy configured in `vite.config.ts`
- Hot module reloading enabled
- TypeScript strict mode
- ESLint configured

---

## 🧪 Testing

### Unit Tests (to be added)

```bash
npm run test
```

### E2E Tests (to be added)

```bash
npm run test:e2e
```

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

Creates optimized production build in `dist/` folder.

### Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=https://api.familyhub.com
REACT_APP_ENV=production
```

---

## 🔄 API Features

### Batch Operations

```typescript
await apiClient.batchOperations([
  {
    id: 'op-1',
    method: 'GET',
    path: '/badges/users/123'
  },
  {
    id: 'op-2',
    method: 'POST',
    path: '/points/users/123',
    body: { points: 50, activity_type: 'trivia' }
  }
]);
```

### Error Handling

```typescript
try {
  await apiClient.login(email, password);
} catch (error: any) {
  const message = error.response?.data?.message;
  console.error('Login failed:', message);
}
```

---

## 🎨 Design System

### Colors
- **Primary:** Blue (sky-500)
- **Secondary:** Purple (violet-500)
- **Success:** Green (emerald-500)
- **Warning:** Yellow (amber-500)
- **Error:** Red (red-500)

### Components

```tsx
// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-large">Large</button>

// Cards
<div className="card">Card content</div>
<div className="card-hover">Hoverable card</div>

// Badges
<span className="badge badge-primary">Badge</span>

// Forms
<input className="input" type="text" />
<label className="label">Label</label>
```

---

## 📱 Pages Overview

### Dashboard (`/dashboard`)
- User welcome
- Points summary
- Badges count
- Streak display
- Quick actions

### Activity Board (`/activity`)
- 20 activity sections
- Games, Trivia, Homework, etc.
- Quick access to activities

### Login (`/login`)
- Email/password login
- Link to signup
- Error messages

### Signup (`/signup`)
- Registration form
- Email verification ready
- Link to login

---

## 🚀 Performance

- Lazy loading routes
- Code splitting with Vite
- Optimized bundle size
- Compression on API responses
- Caching strategies ready

---

## 🔐 Security

- ✅ HTTPS ready
- ✅ CORS configured
- ✅ Auth token handling
- ✅ Input validation
- ✅ XSS prevention

---

## 📚 Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts
# Or kill process using port 5173
```

### API Connection Issues
```bash
# Check backend is running on :3000
# Check proxy in vite.config.ts
# Check CORS settings in backend
```

### Build Errors
```bash
# Clear node_modules and cache
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Next Steps

1. ✅ Project structure setup
2. ✅ API client configured
3. ✅ Auth flow implemented
4. ✅ Basic pages created
5. ⏳ Build out 20 activity sections
6. ⏳ Create badge display
7. ⏳ Implement leaderboard
8. ⏳ Add user settings
9. ⏳ Write tests
10. ⏳ Deploy to production

---

## 👥 Contributing

- Follow existing code style
- Use TypeScript strictly
- Write tests for new features
- Update documentation

---

**Status:** Ready for Development ✅

Start building: `npm run dev`
