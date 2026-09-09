import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import KioskHome from '@/pages/KioskHome';

const { mockUseKiosk, mockNavigate } = vi.hoisted(() => ({
  mockUseKiosk: vi.fn(),
  mockNavigate: vi.fn(),
}));
vi.mock('@hooks/useKiosk', () => ({ useKiosk: mockUseKiosk }));
vi.mock('@hooks/useClock', () => ({
  useClock: () => new Date('2026-09-09T14:30:00'),
  formatClockTime: () => '2:30',
  formatClockDate: () => 'Wed, Sep 9',
}));
vi.mock('@hooks/useWeather', () => ({
  useWeather: () => ({ weather: { current: { temp: 71, icon: '☀️' } }, location: 'Denver' }),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const fns = { switchProfile: vi.fn(), unlockParent: vi.fn().mockResolvedValue(undefined) };

function withKiosk(over = {}) {
  mockUseKiosk.mockReturnValue({
    profiles: [
      { userId: 'p1', name: 'priya', role: 'parent', color: 'priya' },
      { userId: 'k1', name: 'karishma', role: 'child', color: 'karishma' },
    ],
    familyName: 'Narsai',
    hasPin: true,
    ...fns,
    ...over,
  });
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <KioskHome />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('KioskHome', () => {
  it('shows the clock, weather and family picker', () => {
    withKiosk();
    renderPage();
    expect(screen.getByText('2:30')).toBeInTheDocument();
    expect(screen.getByText(/71°/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /narsai — tap your name/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /karishma/i })).toBeInTheDocument();
  });

  it('a kid tap selects the profile and navigates to the dashboard', async () => {
    withKiosk();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /karishma/i }));
    expect(fns.switchProfile).toHaveBeenCalledWith('k1');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('a parent tap opens the PIN pad', async () => {
    withKiosk();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /priya/i }));
    expect(screen.getByRole('dialog', { name: /family pin/i })).toBeInTheDocument();
  });

  it('falls back to a setup message with no profiles', () => {
    withKiosk({ profiles: [] });
    renderPage();
    expect(screen.getByText(/setting up/i)).toBeInTheDocument();
  });
});
