/**
 * Dashboard Page — quick-action navigation
 *
 * The existing Dashboard.test.tsx never clicks any of the dashboard's ten
 * quick-action buttons, so their onClick={() => navigate(path)} handlers
 * were never actually invoked. This file clicks each one and verifies it
 * calls navigate with the right path.
 */

import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    isLoading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

function renderDashboard() {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(/loading your dashboard/i)).not.toBeInTheDocument();
  });
}

describe('Dashboard quick-action navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['Announcements', '/announcements'],
    ['Reminders', '/reminders'],
    ['Calendar', '/calendar'],
    ['Energy', '/energy'],
    ['Smart Home', '/smartthings'],
    ['Family', '/family'],
  ])('quick action button %s navigates to %s', async (label, path) => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    const buttons = screen.getAllByRole('button', { name: new RegExp(label, 'i') });
    await user.click(buttons[buttons.length - 1]);

    expect(mockNavigate).toHaveBeenCalledWith(path);
  });

  it('the announcements widget "View All" button navigates to /announcements', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    const viewAllButtons = screen.getAllByRole('button', { name: /view all$/i });
    await user.click(viewAllButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/announcements');
  });

  it('the reminders widget "View All" button navigates to /reminders', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    const viewAllButtons = screen.getAllByRole('button', { name: /view all$/i });
    await user.click(viewAllButtons[1]);

    expect(mockNavigate).toHaveBeenCalledWith('/reminders');
  });

  it('the energy widget "View Details" button navigates to /energy', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    await user.click(screen.getByRole('button', { name: /view details/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/energy');
  });

  it('the shopping widget "View Full List" button navigates to /shopping-list', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    await user.click(screen.getByRole('button', { name: /view full list/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/shopping-list');
  });

  it('the family widget "Manage Family" button navigates to /family', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    await user.click(screen.getByRole('button', { name: /manage family/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/family');
  });

  it('the activity widget "View All Activity" button navigates to /activity', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitForLoaded();

    await user.click(screen.getByRole('button', { name: /view all activity/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/activity');
  });
});
