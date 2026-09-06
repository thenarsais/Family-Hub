import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnnouncementsPage from '@/pages/AnnouncementsPage';

const { mockUseAuth, mockUseFamily, mockUseAnnouncements } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFamily: vi.fn(),
  mockUseAnnouncements: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));
vi.mock('@hooks/useAnnouncements', () => ({ useAnnouncements: mockUseAnnouncements }));

const create = vi.fn().mockResolvedValue({ id: 'new' });
const update = vi.fn().mockResolvedValue({ id: 'a1' });
const del = vi.fn().mockResolvedValue(undefined);

function withAnnouncements(list: unknown[]) {
  mockUseAnnouncements.mockReturnValue({
    announcements: list,
    loading: false,
    error: null,
    createAnnouncement: create,
    updateAnnouncement: update,
    deleteAnnouncement: del,
  });
}

function asRole(role: string) {
  mockUseAuth.mockReturnValue({ user: { id: 'u1' } });
  mockUseFamily.mockReturnValue({
    family: { id: 'f1', name: 'Narsai' },
    members: [{ user_id: 'u1', role }],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  create.mockResolvedValue({ id: 'new' });
});

describe('AnnouncementsPage', () => {
  it('lists announcements with pinned / status badges', () => {
    asRole('child');
    withAnnouncements([
      { id: 'a1', title: 'Movie night', message: 'Movie night', is_pinned: true, created_at: null },
      { id: 'a2', title: 'Working late', message: 'Working late', announcement_type: 'status', created_at: null },
    ]);
    render(<AnnouncementsPage />);

    expect(screen.getByText('Movie night')).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('hides the create form and row controls from a non-manager', () => {
    asRole('child');
    withAnnouncements([{ id: 'a1', title: 'x', message: 'x', is_pinned: false, created_at: null }]);
    render(<AnnouncementsPage />);

    expect(screen.queryByRole('heading', { name: /new announcement/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
  });

  it('a parent can post a new announcement', async () => {
    const user = userEvent.setup();
    asRole('parent');
    withAnnouncements([]);
    render(<AnnouncementsPage />);

    await user.type(screen.getByLabelText('Message'), 'Bins out by 7');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(create).toHaveBeenCalledWith('f1', 'Bins out by 7', 'Bins out by 7', {
      is_pinned: true,
      announcement_type: 'general',
    });
  });

  it('pin toggle and delete call the hook', async () => {
    const user = userEvent.setup();
    asRole('parent');
    withAnnouncements([{ id: 'a1', title: 'x', message: 'x', is_pinned: false, created_at: null }]);
    render(<AnnouncementsPage />);

    await user.click(screen.getByRole('button', { name: /^pin$/i }));
    expect(update).toHaveBeenCalledWith('a1', { is_pinned: true });

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(del).toHaveBeenCalledWith('a1');
  });
});
