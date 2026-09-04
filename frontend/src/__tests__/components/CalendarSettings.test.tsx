import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarSettings } from '@/components/Calendar/CalendarSettings';

const { mockUseFamily } = vi.hoisted(() => ({ mockUseFamily: vi.fn() }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));

const baseProps = {
  googleConnected: true,
  googleEmail: 'priya@gmail.com',
  onConnect: vi.fn().mockResolvedValue(''),
  onDisconnect: vi.fn().mockResolvedValue(undefined),
  dismissedEvents: [],
  eventTitleFor: () => undefined,
  onRestore: vi.fn().mockResolvedValue(undefined),
  canManage: true,
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFamily.mockReturnValue({ members: [], updateMemberColor: vi.fn().mockResolvedValue(undefined) });
});

describe('CalendarSettings', () => {
  it('shows the connected account and a Disconnect button for a manager', async () => {
    const onDisconnect = vi.fn().mockResolvedValue(undefined);
    render(<CalendarSettings {...baseProps} onDisconnect={onDisconnect} />);

    expect(screen.getByText('priya@gmail.com')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /disconnect/i }));
    expect(onDisconnect).toHaveBeenCalled();
  });

  it('offers Connect when not connected', async () => {
    const onConnect = vi.fn().mockResolvedValue('');
    render(<CalendarSettings {...baseProps} googleConnected={false} googleEmail={null} onConnect={onConnect} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /^connect$/i }));
    expect(onConnect).toHaveBeenCalled();
  });

  it('hides the Disconnect control from a non-manager', () => {
    render(<CalendarSettings {...baseProps} canManage={false} />);
    expect(screen.queryByRole('button', { name: /disconnect/i })).not.toBeInTheDocument();
  });

  it('lists hidden events and restores one', async () => {
    const onRestore = vi.fn().mockResolvedValue(undefined);
    render(
      <CalendarSettings
        {...baseProps}
        onRestore={onRestore}
        dismissedEvents={[{ event_id: 'g1', calendar_id: 'cal-1' }]}
        eventTitleFor={(id) => (id === 'g1' ? 'Soccer practice' : undefined)}
      />
    );

    expect(screen.getByText('Soccer practice')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /restore/i }));
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith('g1', 'google', 'cal-1'));
  });

  it('shows the empty state when nothing is hidden', () => {
    render(<CalendarSettings {...baseProps} />);
    expect(screen.getByText(/nothing hidden/i)).toBeInTheDocument();
  });

  it('lets a manager set a member colour', async () => {
    const updateMemberColor = vi.fn().mockResolvedValue(undefined);
    mockUseFamily.mockReturnValue({
      members: [{ id: 'm1', user_id: 'u-krish', name: 'Krish', color: null }],
      updateMemberColor,
    });
    render(<CalendarSettings {...baseProps} />);

    await userEvent.setup().selectOptions(screen.getByLabelText(/colour for krish/i), 'krish');
    expect(updateMemberColor).toHaveBeenCalledWith('u-krish', 'krish');
  });

  it('does not render the colour section for a non-manager', () => {
    mockUseFamily.mockReturnValue({
      members: [{ id: 'm1', user_id: 'u-krish', name: 'Krish' }],
      updateMemberColor: vi.fn(),
    });
    render(<CalendarSettings {...baseProps} canManage={false} />);
    expect(screen.queryByText(/calendar colours/i)).not.toBeInTheDocument();
  });

  it('closes on the X button', async () => {
    const onClose = vi.fn();
    render(<CalendarSettings {...baseProps} onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
