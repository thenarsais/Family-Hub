/**
 * Dashboard widgets — data-populated rendering.
 *
 * Dashboard.test.tsx only exercises the empty/loading path (mocked apiClient
 * returns `{}`). This file mocks the Phase-2 hooks with real data and checks
 * each widget renders it, plus the two derived stat cards (points this week,
 * activity streak).
 */
import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Priya' }, isLoading: false }),
}));

// WeekCalendar has its own hook wiring / tests; stub it out here.
vi.mock('@/components/Calendar', () => ({ WeekCalendar: () => <div data-testid="week-calendar" /> }));

const day = (offsetDays: number) =>
  new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000).toISOString();

vi.mock('@/hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({
    announcements: [{ id: 'a1', title: 'Trash night', message: 'Bins out by 7am', is_pinned: true }],
    loading: false,
  }),
}));
vi.mock('@/hooks/useReminders', () => ({
  useReminders: () => ({
    upcomingReminders: [{ id: 'r1', title: 'Dentist', scheduled_time: day(-1) }],
    loading: false,
  }),
}));
vi.mock('@/hooks/useEnergy', () => ({
  useEnergy: () => ({
    currentMonth: 120,
    goals: [{ id: 'g1', goal_type: 'monthly', target_kwh: 400, status: 'active' }],
    loading: false,
  }),
}));
vi.mock('@/hooks/useFamily', () => ({
  useFamily: () => ({
    family: { id: 'f1', name: 'The Narsais', description: 'Home base' },
    members: [{ id: 'm1', user_id: 'u1', role: 'parent' }],
    loading: false,
  }),
}));
vi.mock('@/hooks/useActivityLog', () => ({
  useActivityLog: () => ({
    activity: [
      { id: 'e1', action: 'Completed a chore', points_earned: 10, created_at: day(0) },
      { id: 'e2', action: 'Logged reading', points_earned: 5, created_at: day(1) },
      { id: 'e3', action: 'Old thing', points_earned: 99, created_at: day(30) },
    ],
    loading: false,
  }),
}));
vi.mock('@/hooks/useShoppingList', () => ({
  useShoppingList: () => ({
    items: [
      { id: 's1', name: 'Milk', quantity: 2, unit: 'gal', completed: false },
      { id: 's2', name: 'Eggs', quantity: 1, unit: 'dozen', completed: true },
    ],
    loading: false,
  }),
}));

const renderDashboard = () =>
  render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );

describe('Dashboard widgets (populated)', () => {
  it('renders each widget with its hook data', () => {
    renderDashboard();
    expect(screen.getByText(/Trash night/)).toBeInTheDocument();
    expect(screen.getByText('Dentist')).toBeInTheDocument();
    expect(screen.getByText('120 kWh')).toBeInTheDocument();
    expect(screen.getByText('The Narsais')).toBeInTheDocument();
    expect(screen.getByText('Completed a chore')).toBeInTheDocument();
    expect(screen.getByText(/2 gal Milk/)).toBeInTheDocument();
  });

  it('derives "points this week" from the last 7 days of activity only', () => {
    renderDashboard();
    // 10 + 5 within the week; the 99 from 30 days ago is excluded.
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('derives the activity streak from consecutive-day activity', () => {
    renderDashboard();
    // entries today and yesterday -> 2 days
    expect(screen.getByText('2 days')).toBeInTheDocument();
  });

  it('shows the energy goal progress', () => {
    renderDashboard();
    // 120 / 400 = 30%
    expect(screen.getByText(/30% of the monthly goal/)).toBeInTheDocument();
  });
});
