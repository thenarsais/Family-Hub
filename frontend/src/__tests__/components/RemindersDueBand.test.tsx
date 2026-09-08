import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { RemindersDueBand } from '@/components/shell/RemindersDueBand';

const { mockDismiss, mockHook } = vi.hoisted(() => ({
  mockDismiss: vi.fn(),
  mockHook: vi.fn(),
}));

vi.mock('@hooks/useReminders', () => ({ useReminders: mockHook }));

function withDue(list: unknown[]) {
  mockHook.mockReturnValue({ dueReminders: list, dismissReminder: mockDismiss });
}

const renderBand = () =>
  render(
    <MemoryRouter>
      <RemindersDueBand />
    </MemoryRouter>,
  );

describe('RemindersDueBand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDismiss.mockResolvedValue(undefined);
  });

  it('renders nothing when nothing is due', () => {
    withDue([]);
    const { container } = renderBand();
    expect(container).toBeEmptyDOMElement();
  });

  it('lists each due reminder with its assignee tag', () => {
    withDue([
      { id: 'r1', title: 'Take out trash', assignee_name: 'Sam' },
      { id: 'r2', title: 'Give meds', assignee_name: null },
    ]);
    renderBand();

    expect(screen.getByText('Take out trash')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Give meds')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Done' })).toHaveLength(2);
  });

  it('calls dismissReminder when Done is clicked', async () => {
    withDue([{ id: 'r1', title: 'Take out trash', assignee_name: 'Sam' }]);
    renderBand();

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(mockDismiss).toHaveBeenCalledWith('r1');
  });
});
