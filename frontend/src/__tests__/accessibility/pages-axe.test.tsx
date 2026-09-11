/**
 * Runs jest-axe against the real page components (not synthetic markup).
 * form-accessibility.test.tsx checks hand-rolled form fixtures that verify
 * WCAG *patterns* in the abstract; this file checks what the app actually
 * ships, using the same render/mock setup as each page's own test file.
 */

import { vi, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import SmartHomePage from '@/pages/SmartHome';
import ActivityBoard from '@/pages/ActivityBoard';
import KidsBoard from '@/pages/KidsBoard';
import KioskHome from '@/pages/KioskHome';
import LearnPage from '@/pages/LearnPage';
import * as deviceHook from '@/hooks/useDevices';

expect.extend(toHaveNoViolations);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

vi.mock('@stores/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    signup: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    isLoading: false,
  }),
}));

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/hooks/useDevices');

vi.mock('@/hooks/useFamily', () => ({
  useFamily: () => ({
    loading: false,
    members: [
      { user_id: 'user-1', role: 'parent', name: 'Test User' },
      { user_id: 'kid-1', role: 'child', name: 'Karishma Kid' },
    ],
  }),
}));

vi.mock('@/hooks/useKidBoard', () => ({
  useKidBoard: () => ({
    routines: [
      { id: 'r1', userId: 'kid-1', slot: 'morning', label: 'Brush teeth', emoji: '🪥', sortOrder: 0, enabled: true, doneToday: false },
      { id: 'r2', userId: 'kid-1', slot: 'evening', label: 'Pajamas', emoji: '👕', sortOrder: 0, enabled: true, doneToday: true },
    ],
    manageRoutines: [],
    todayMood: null,
    loading: false,
    error: null,
    completeRoutine: vi.fn(),
    undoRoutine: vi.fn(),
    setMood: vi.fn(),
    createRoutine: vi.fn(),
    updateRoutine: vi.fn(),
    refresh: vi.fn(),
    refreshManage: vi.fn(),
  }),
}));

vi.mock('@/hooks/useSpeak', () => ({
  useSpeak: () => ({ supported: false, hasGujaratiVoice: false, speak: vi.fn() }),
}));

vi.mock('@/hooks/useTrivia', () => ({
  useTrivia: () => ({
    question: {
      id: 'q1', question: 'Largest planet?', category: 'Space', difficulty: 'easy',
      options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], hint: 'J', pointsValue: 10,
    },
    attempt: null,
    streak: 0,
    stats: { answered: 0, correct: 0 },
    loading: false,
    error: null,
    submit: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useHomework', () => ({
  useHomework: () => ({
    items: [
      {
        id: 'hw-1', userId: 'kid-1', title: 'Spelling list', subject: 'English',
        dueDate: '2020-01-01', pointsValue: 10, completedAt: null, isOverdue: true, completed: false,
      },
      {
        id: 'hw-2', userId: 'kid-1', title: 'Math worksheet', subject: 'Math',
        dueDate: new Date().toISOString().slice(0, 10), pointsValue: 10,
        completedAt: null, isOverdue: false, completed: false,
      },
      {
        id: 'hw-3', userId: 'kid-1', title: 'Science reading', subject: null,
        dueDate: new Date().toISOString().slice(0, 10), pointsValue: 10,
        completedAt: new Date().toISOString(), pointsEarned: 10, isOverdue: false, completed: true,
      },
    ],
    familyItems: [],
    loading: false,
    error: null,
    complete: vi.fn(),
    uncomplete: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    loadFamilyItems: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useReading', () => ({
  useReading: () => ({
    goals: { dailyMinutes: 20, weeklyMinutes: 100, pointsValue: 10 },
    log: { minutes: 25, goalMet: true, pointsEarned: 10 },
    weekMinutes: 55,
    streak: 2,
    loading: false,
    error: null,
    submit: vi.fn(),
    undo: vi.fn(),
    familyGoals: [],
    loadFamilyGoals: vi.fn(),
    updateGoals: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useKungFu', () => ({
  useKungFu: () => ({
    profile: { belt: 'Yellow Sash', beltSince: '2026-06-01', pointsPerClass: 15, pointsPerPractice: 5 },
    todayLogs: [{ id: 'log-1', sessionType: 'class', pointsEarned: 15, loggedAt: new Date().toISOString() }],
    weekCounts: { class: 1, practice: 2 },
    loading: false,
    error: null,
    logClass: vi.fn(),
    logPractice: vi.fn(),
    undo: vi.fn(),
    familyProfiles: [],
    loadFamilyProfiles: vi.fn(),
    updateProfile: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useLearning', () => ({
  useLearning: () => ({
    lessons: [
      { id: 'l1', category: 'alphabet', phase: 'phase_1_alphabet', subcategory: 'vowels', sequenceOrder: 0, content: { text: 'અ', romanization: 'a', pronunciation: 'uh', english: 'vowel a' }, pointsValue: 10, completed: false, pointsEarned: 0 },
    ],
    byPhase: { phase_1_alphabet: { vowels: [{ id: 'l1', category: 'alphabet', phase: 'phase_1_alphabet', subcategory: 'vowels', sequenceOrder: 0, content: { text: 'અ', romanization: 'a', pronunciation: 'uh', english: 'vowel a' }, pointsValue: 10, completed: false, pointsEarned: 0 }] } },
    stats: { totalLessonsCompleted: 0, totalPointsEarned: 0, alphabet: { completed: 0, total: 47 }, numbers: { completed: 0, total: 10 }, vocabulary: { completed: 0, total: 120 } },
    loading: false,
    error: null,
    completeLesson: vi.fn(),
    recordQuizAnswer: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/hooks/useKiosk', () => ({
  useKiosk: () => ({
    profiles: [
      { userId: 'p1', name: 'Priya', role: 'parent', color: 'priya' },
      { userId: 'k1', name: 'Karishma', role: 'child', color: 'karishma' },
    ],
    familyName: 'Narsai',
    hasPin: true,
    switchProfile: vi.fn(),
    unlockParent: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Real page accessibility (axe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });
  });

  it('Login page has no axe violations', async () => {
    const { container } = renderWithRouter(<Login />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Signup page has no axe violations', async () => {
    const { container } = renderWithRouter(<Signup />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Dashboard page has no axe violations', async () => {
    const { container } = renderWithRouter(<Dashboard />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('SmartHome page has no axe violations', async () => {
    const { container } = render(<SmartHomePage />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ActivityBoard page has no axe violations', async () => {
    // the Gujarati section renders a <Link>, so it needs a router context now
    const { container } = renderWithRouter(<ActivityBoard />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('KidsBoard page has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/kids/kid-1']}>
        <Routes>
          <Route path="/kids/:memberId" element={<KidsBoard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('KioskHome page has no axe violations', async () => {
    const { container } = renderWithRouter(<KioskHome />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('LearnPage has no axe violations', async () => {
    const { container } = renderWithRouter(<LearnPage />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
