import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileBar from '@/components/kiosk/ProfileBar';

const { mockUseKiosk, mockNavigate } = vi.hoisted(() => ({
  mockUseKiosk: vi.fn(),
  mockNavigate: vi.fn(),
}));
vi.mock('@hooks/useKiosk', () => ({ useKiosk: mockUseKiosk }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const PROFILES = [
  { userId: 'p1', name: 'priya', role: 'parent', color: 'priya' },
  { userId: 'k1', name: 'karishma', role: 'child', color: 'karishma' },
];

const fns = {
  switchProfile: vi.fn(),
  unlockParent: vi.fn().mockResolvedValue(undefined),
  revert: vi.fn(),
};

function withKiosk(over: Partial<ReturnType<typeof mockUseKiosk>> = {}) {
  mockUseKiosk.mockReturnValue({
    profiles: PROFILES,
    activeProfileId: null,
    hasPin: true,
    ...fns,
    ...over,
  });
}

beforeEach(() => vi.clearAllMocks());

describe('ProfileBar', () => {
  it('renders a face per profile', () => {
    withKiosk();
    render(<ProfileBar />);
    expect(screen.getByRole('button', { name: /priya/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /karishma/i })).toBeInTheDocument();
  });

  it('tapping a kid switches straight to their board', async () => {
    withKiosk();
    render(<ProfileBar />);
    await userEvent.click(screen.getByRole('button', { name: /karishma/i }));
    expect(fns.switchProfile).toHaveBeenCalledWith('k1');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('tapping Parent opens the PIN pad when a PIN is set', async () => {
    withKiosk();
    render(<ProfileBar />);
    await userEvent.click(screen.getByRole('button', { name: /priya/i }));
    expect(screen.getByRole('dialog', { name: /family pin/i })).toBeInTheDocument();
    expect(fns.switchProfile).not.toHaveBeenCalled();
  });

  it('tapping Parent switches directly when no PIN is set', async () => {
    withKiosk({ hasPin: false });
    render(<ProfileBar />);
    await userEvent.click(screen.getByRole('button', { name: /priya/i }));
    expect(fns.switchProfile).toHaveBeenCalledWith('p1');
  });

  it('shows a lock button only when a profile is active', () => {
    withKiosk({ activeProfileId: 'k1' });
    render(<ProfileBar />);
    expect(screen.getByRole('button', { name: /lock the display/i })).toBeInTheDocument();
  });

  it('the lock button reverts and navigates home', async () => {
    withKiosk({ activeProfileId: 'k1' });
    render(<ProfileBar />);
    await userEvent.click(screen.getByRole('button', { name: /lock the display/i }));
    expect(fns.revert).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('completing the PIN pad unlocks the Parent profile and navigates', async () => {
    withKiosk();
    render(<ProfileBar />);
    await userEvent.click(screen.getByRole('button', { name: /priya/i }));
    for (const d of '1234') {
      await userEvent.click(screen.getByRole('button', { name: d }));
    }
    expect(fns.unlockParent).toHaveBeenCalledWith('1234');
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('renders nothing without profiles', () => {
    withKiosk({ profiles: [] });
    const { container } = render(<ProfileBar />);
    expect(container).toBeEmptyDOMElement();
  });
});
