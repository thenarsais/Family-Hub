import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PriorityBand } from '@/components/shell/PriorityBand';

const { mockReminders, mockAnnouncements } = vi.hoisted(() => ({
  mockReminders: vi.fn(),
  mockAnnouncements: vi.fn(),
}));
vi.mock('@hooks/useReminders', () => ({ useReminders: mockReminders }));
vi.mock('@hooks/useAnnouncements', () => ({ useAnnouncements: mockAnnouncements }));

function withData(opts: { due?: unknown[]; announcements?: unknown[] } = {}) {
  mockReminders.mockReturnValue({
    dueReminders: opts.due ?? [],
    dismissReminder: vi.fn(),
  });
  mockAnnouncements.mockReturnValue({
    announcements: opts.announcements ?? [],
    createAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
  });
}

const renderBand = (props: Partial<React.ComponentProps<typeof PriorityBand>> = {}) =>
  render(
    <MemoryRouter>
      <PriorityBand {...props} />
    </MemoryRouter>,
  );

const DUE = [{ id: 'r1', title: 'Take out trash', assignee_name: 'Sam' }];
const PINNED = [{ id: 'a1', title: 'Movie night', message: 'Movie night', is_pinned: true }];

beforeEach(() => vi.clearAllMocks());

describe('PriorityBand', () => {
  it('renders nothing when both are empty and the viewer cannot post', () => {
    withData();
    const { container } = renderBand({ canPost: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only the reminders row when just a reminder is due', () => {
    withData({ due: DUE });
    renderBand({ canPost: false });
    expect(screen.getByText('Due now')).toBeInTheDocument();
    expect(screen.getByText('Take out trash')).toBeInTheDocument();
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument();
  });

  it('shows only the announcements row when just announcements exist', () => {
    withData({ announcements: PINNED });
    renderBand({ canPost: false });
    expect(screen.getByText('Announcements')).toBeInTheDocument();
    expect(screen.getByText('Movie night')).toBeInTheDocument();
    expect(screen.queryByText('Due now')).not.toBeInTheDocument();
  });

  it('shows the framed region for a parent even with no content', () => {
    withData();
    const { container } = renderBand({ canPost: true });
    expect(container.querySelector('section.divide-y')).toBeInTheDocument();
    expect(screen.getByText('Announcements')).toBeInTheDocument();
  });

  it('stacks the reminders row before the announcements row in one section', () => {
    withData({ due: DUE, announcements: PINNED });
    const { container } = renderBand({ canPost: false });

    const section = container.querySelector('section.divide-y');
    expect(section).toBeInTheDocument();

    const due = screen.getByText('Take out trash');
    const announce = screen.getByText('Movie night');
    expect(due.compareDocumentPosition(announce) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
