import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { AnnouncementsBand } from '@/components/shell/AnnouncementsBand';

const { mockCreate, mockDelete, mockHook } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockHook: vi.fn(),
}));

vi.mock('@hooks/useAnnouncements', () => ({ useAnnouncements: mockHook }));

function withAnnouncements(list: unknown[]) {
  mockHook.mockReturnValue({
    announcements: list,
    createAnnouncement: mockCreate,
    deleteAnnouncement: mockDelete,
  });
}

function renderBand(props: Partial<React.ComponentProps<typeof AnnouncementsBand>> = {}) {
  return render(
    <MemoryRouter>
      <AnnouncementsBand {...props} />
    </MemoryRouter>,
  );
}

describe('AnnouncementsBand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'new' });
    mockDelete.mockResolvedValue(undefined);
  });

  it('renders nothing when there is nothing to show and the viewer cannot post', () => {
    withAnnouncements([]);
    const { container } = renderBand({ canPost: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows pinned announcements, ignoring unpinned ones', () => {
    withAnnouncements([
      { id: '1', title: 'Movie night Friday', is_pinned: true },
      { id: '2', title: 'unpinned note', is_pinned: false },
    ]);
    renderBand({ canPost: false });
    expect(screen.getByText('Movie night Friday')).toBeInTheDocument();
    expect(screen.queryByText('unpinned note')).not.toBeInTheDocument();
  });

  it('falls back to recent announcements when none are pinned', () => {
    withAnnouncements([{ id: '1', message: 'just a message', is_pinned: false }]);
    renderBand({ canPost: false });
    expect(screen.getByText('just a message')).toBeInTheDocument();
  });

  it('tags a status-type announcement', () => {
    withAnnouncements([{ id: '1', title: 'Working late', is_pinned: true, announcement_type: 'status' }]);
    renderBand({ canPost: false });
    expect(screen.getByText('status')).toBeInTheDocument();
  });

  it('a parent sees quick-post preset chips + a Manage link', () => {
    withAnnouncements([]);
    renderBand({ canPost: true, familyId: 'f1' });
    expect(screen.getByRole('button', { name: 'Movie night 🍿' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute('href', '/announcements');
  });

  it('a preset chip posts a pinned announcement immediately', async () => {
    const user = userEvent.setup();
    withAnnouncements([]);
    renderBand({ canPost: true, familyId: 'f1' });

    await user.click(screen.getByRole('button', { name: 'Working late' }));

    expect(mockCreate).toHaveBeenCalledWith('f1', 'Working late', "I'm working late tonight.", {
      is_pinned: true,
      announcement_type: 'status',
    });
  });

  it('the ✕ on an item dismisses it (parents only)', async () => {
    const user = userEvent.setup();
    withAnnouncements([{ id: 'a1', title: 'Bins out', is_pinned: true }]);
    renderBand({ canPost: true, familyId: 'f1' });

    await user.click(screen.getByRole('button', { name: /dismiss "bins out"/i }));
    expect(mockDelete).toHaveBeenCalledWith('a1');
  });

  it('non-parents get no dismiss control', () => {
    withAnnouncements([{ id: 'a1', title: 'Bins out', is_pinned: true }]);
    renderBand({ canPost: false });
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('composes and creates a pinned free-text announcement', async () => {
    const user = userEvent.setup();
    withAnnouncements([]);
    renderBand({ canPost: true, familyId: 'f1' });

    await user.click(screen.getByRole('button', { name: /write/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'Bins out by 7');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).toHaveBeenCalledWith('f1', 'Bins out by 7', 'Bins out by 7', {
      is_pinned: true,
      announcement_type: 'general',
    });
  });

  it('does not submit free text without a family id', async () => {
    const user = userEvent.setup();
    withAnnouncements([]);
    renderBand({ canPost: true });

    await user.click(screen.getByRole('button', { name: /write/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'orphan');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('cancel closes the composer without posting', async () => {
    const user = userEvent.setup();
    withAnnouncements([{ id: '1', title: 'Existing', is_pinned: true }]);
    renderBand({ canPost: true, familyId: 'f1' });

    await user.click(screen.getByRole('button', { name: /write/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Existing')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('stays usable when creating fails', async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce(new Error('boom'));
    withAnnouncements([]);
    renderBand({ canPost: true, familyId: 'f1' });

    await user.click(screen.getByRole('button', { name: /write/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'will fail');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/everyone should see/i)).toBeInTheDocument();
  });
});
