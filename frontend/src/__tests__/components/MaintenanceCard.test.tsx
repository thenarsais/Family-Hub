import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MaintenanceCard } from '@/components/Maintenance/MaintenanceCard';
import type { MaintenanceItem } from '@/hooks/useMaintenance';

const shell = {
  id: 'maintenance',
  expanded: false,
  onToggle: vi.fn(),
  onReorder: vi.fn(),
  onMove: vi.fn(),
};

const item = (over: Partial<MaintenanceItem> = {}): MaintenanceItem => ({
  id: 'm1',
  name: 'HVAC air filter',
  intervalDays: 90,
  lastDoneAt: '2026-09-01',
  nextDueAt: '2026-11-30',
  daysUntilDue: 79,
  ...over,
});

function renderCard(overrides: Partial<React.ComponentProps<typeof MaintenanceCard>> = {}) {
  const handlers = { onAdd: vi.fn(), onMarkDone: vi.fn(), onRemove: vi.fn() };
  render(
    <MaintenanceCard {...shell} items={[]} loading={false} error={null} {...handlers} {...overrides} />,
  );
  return handlers;
}

describe('MaintenanceCard', () => {
  it('shows a loading spinner', () => {
    renderCard({ loading: true });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows the load error instead of the list', () => {
    renderCard({ error: 'network is down' });
    expect(screen.getByText('network is down')).toBeInTheDocument();
  });

  it('shows an empty-state message with no items', () => {
    renderCard();
    expect(screen.getByText(/nothing tracked yet/i)).toBeInTheDocument();
  });

  it('renders each item with its due status', () => {
    renderCard({
      items: [
        item({ id: 'overdue-1', name: 'Water heater flush', daysUntilDue: -3 }),
        item({ id: 'soon-1', name: 'Gutter cleaning', daysUntilDue: 5 }),
        item({ id: 'ok-1', name: 'Mattress flip', daysUntilDue: 120 }),
      ],
    });
    expect(screen.getByText('Water heater flush')).toBeInTheDocument();
    expect(screen.getByText('Overdue by 3 days')).toBeInTheDocument();
    expect(screen.getByText('Due in 5 days')).toBeInTheDocument();
    expect(screen.getByText('Due in 120 days')).toBeInTheDocument();
  });

  it('shows "Due today" at exactly zero days', () => {
    renderCard({ items: [item({ daysUntilDue: 0 })] });
    expect(screen.getByText('Due today')).toBeInTheDocument();
  });

  it('shows the "N due this month" count when items exist', () => {
    renderCard({
      items: [item({ id: 'a', daysUntilDue: 10 }), item({ id: 'b', daysUntilDue: 90 })],
    });
    expect(screen.getByText('1 due this month')).toBeInTheDocument();
  });

  it('calls onMarkDone when the check button is clicked', async () => {
    const { onMarkDone } = renderCard({ items: [item({ id: 'm1', name: 'HVAC air filter' })] });
    await userEvent.click(screen.getByRole('button', { name: /mark "hvac air filter" done/i }));
    expect(onMarkDone).toHaveBeenCalledWith('m1');
  });

  it('calls onRemove when the remove button is clicked', async () => {
    const { onRemove } = renderCard({ items: [item({ id: 'm1', name: 'HVAC air filter' })] });
    await userEvent.click(screen.getByRole('button', { name: /remove "hvac air filter"/i }));
    expect(onRemove).toHaveBeenCalledWith('m1');
  });

  it('adds an item converting the interval value+unit to days', async () => {
    const { onAdd } = renderCard();

    await userEvent.type(screen.getByLabelText(/new maintenance item name/i), 'Test the smoke alarm');
    const valueInput = screen.getByLabelText(/interval value/i);
    // fireEvent.change, not userEvent.clear()+type() -- clear() leaves this
    // controlled number input at its clamped floor (1), so typing appends
    // onto that instead of replacing it (the recurring gotcha from T-20/21/etc).
    fireEvent.change(valueInput, { target: { value: '2' } });
    await userEvent.selectOptions(screen.getByLabelText(/interval unit/i), 'weeks');
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAdd).toHaveBeenCalledWith({ name: 'Test the smoke alarm', intervalDays: 14 });
  });

  it('does not submit with a blank name', async () => {
    const { onAdd } = renderCard();
    await userEvent.click(screen.getByRole('button', { name: /add item/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
