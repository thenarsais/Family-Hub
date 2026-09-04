import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCard } from '@/components/shell/DashboardCard';

function setup(props: Partial<React.ComponentProps<typeof DashboardCard>> = {}) {
  const onToggle = vi.fn();
  const onReorder = vi.fn();
  const onMove = vi.fn();
  render(
    <DashboardCard
      id="reminders"
      title="Reminders"
      count={3}
      expanded={false}
      onToggle={onToggle}
      onReorder={onReorder}
      onMove={onMove}
      footer={<button>View All</button>}
      {...props}
    >
      <p>body content</p>
    </DashboardCard>
  );
  return { onToggle, onReorder, onMove };
}

describe('DashboardCard', () => {
  it('renders title, count, body and footer', () => {
    setup();
    expect(screen.getByRole('heading', { name: /reminders/i })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View All' })).toBeInTheDocument();
  });

  it('the header toggle reports collapsed vs expanded via aria-expanded', () => {
    setup({ expanded: false });
    expect(screen.getByRole('button', { name: 'Reminders3' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('calls onToggle with the id when the header is clicked', async () => {
    const user = userEvent.setup();
    const { onToggle } = setup();
    await user.click(screen.getByRole('button', { name: 'Reminders3' }));
    expect(onToggle).toHaveBeenCalledWith('reminders');
  });

  it('expanded removes the clamp on the body', () => {
    const { rerender } = render(
      <DashboardCard
        id="x"
        title="X"
        expanded={false}
        onToggle={vi.fn()}
        onReorder={vi.fn()}
        onMove={vi.fn()}
      >
        <p>b</p>
      </DashboardCard>
    );
    expect(document.getElementById('card-body-x')).toHaveClass('max-h-52');
    rerender(
      <DashboardCard
        id="x"
        title="X"
        expanded
        onToggle={vi.fn()}
        onReorder={vi.fn()}
        onMove={vi.fn()}
      >
        <p>b</p>
      </DashboardCard>
    );
    expect(document.getElementById('card-body-x')).not.toHaveClass('max-h-52');
  });

  it('arrow keys on the drag handle move the card', async () => {
    const user = userEvent.setup();
    const { onMove } = setup();
    const handle = screen.getByRole('button', { name: /reorder reminders/i });
    handle.focus();
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    expect(onMove).toHaveBeenNthCalledWith(1, 'reminders', -1);
    expect(onMove).toHaveBeenNthCalledWith(2, 'reminders', -1);
    expect(onMove).toHaveBeenNthCalledWith(3, 'reminders', 1);
    expect(onMove).toHaveBeenNthCalledWith(4, 'reminders', 1);
  });

  it('highlights while a card is dragged over it', () => {
    setup();
    const section = screen.getByRole('region', { name: /reminders/i });
    fireEvent.dragOver(section);
    expect(section).toHaveClass('ring-2');
    fireEvent.dragLeave(section);
    expect(section).not.toHaveClass('ring-2');
  });

  it('dropping another card on it calls onReorder', () => {
    const { onReorder } = setup();
    const section = screen.getByRole('region', { name: /reminders/i });
    fireEvent.dragOver(section);
    fireEvent.drop(section, { dataTransfer: { getData: () => 'shopping' } });
    expect(onReorder).toHaveBeenCalledWith('shopping', 'reminders');
  });

  it('ignores a drop of the card onto itself', () => {
    const { onReorder } = setup();
    const section = screen.getByRole('region', { name: /reminders/i });
    fireEvent.drop(section, { dataTransfer: { getData: () => 'reminders' } });
    expect(onReorder).not.toHaveBeenCalled();
  });
});
