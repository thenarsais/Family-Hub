import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementsBand } from '@/components/shell/AnnouncementsBand';

const { mockCreate, mockHook } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockHook: vi.fn(),
}));

vi.mock('@hooks/useAnnouncements', () => ({ useAnnouncements: mockHook }));

function withAnnouncements(list: unknown[]) {
  mockHook.mockReturnValue({ announcements: list, createAnnouncement: mockCreate });
}

describe('AnnouncementsBand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue({ id: 'new' });
  });

  it('renders nothing when there is nothing to show and the viewer cannot post', () => {
    withAnnouncements([]);
    const { container } = render(<AnnouncementsBand canPost={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows pinned announcements, ignoring unpinned ones', () => {
    withAnnouncements([
      { id: '1', title: 'Movie night Friday', is_pinned: true },
      { id: '2', title: 'unpinned note', is_pinned: false },
    ]);
    render(<AnnouncementsBand canPost={false} />);
    expect(screen.getByText('Movie night Friday')).toBeInTheDocument();
    expect(screen.queryByText('unpinned note')).not.toBeInTheDocument();
  });

  it('falls back to recent announcements when none are pinned', () => {
    withAnnouncements([{ id: '1', message: 'just a message', is_pinned: false }]);
    render(<AnnouncementsBand canPost={false} />);
    expect(screen.getByText('just a message')).toBeInTheDocument();
  });

  it('separates multiple pinned items', () => {
    withAnnouncements([
      { id: '1', title: 'First', is_pinned: true },
      { id: '2', title: 'Second', is_pinned: true },
    ]);
    render(<AnnouncementsBand canPost={false} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('stays usable when creating an announcement fails', async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce(new Error('boom'));
    withAnnouncements([]);
    render(<AnnouncementsBand canPost familyId="f1" />);

    await user.click(screen.getByRole('button', { name: /^post$/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'will fail');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).toHaveBeenCalled();
    // composer stays open so the parent can retry
    expect(screen.getByPlaceholderText(/everyone should see/i)).toBeInTheDocument();
  });

  it('shows an empty hint and a Post affordance for a parent', () => {
    withAnnouncements([]);
    render(<AnnouncementsBand canPost familyId="f1" />);
    expect(screen.getByText(/no announcements yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post/i })).toBeInTheDocument();
  });

  it('composes and creates a pinned announcement', async () => {
    const user = userEvent.setup();
    withAnnouncements([]);
    render(<AnnouncementsBand canPost familyId="f1" />);

    await user.click(screen.getByRole('button', { name: /^post$/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'Bins out by 7');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).toHaveBeenCalledWith('f1', 'Bins out by 7', 'Bins out by 7', {
      is_pinned: true,
    });
  });

  it('does not submit without a family id', async () => {
    const user = userEvent.setup();
    withAnnouncements([]);
    render(<AnnouncementsBand canPost />);

    await user.click(screen.getByRole('button', { name: /^post$/i }));
    await user.type(screen.getByPlaceholderText(/everyone should see/i), 'orphan');
    await user.click(screen.getByRole('button', { name: /^post$/i }));

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('cancel closes the composer without posting', async () => {
    const user = userEvent.setup();
    withAnnouncements([{ id: '1', title: 'Existing', is_pinned: true }]);
    render(<AnnouncementsBand canPost familyId="f1" />);

    await user.click(screen.getByRole('button', { name: /^post$/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Existing')).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
