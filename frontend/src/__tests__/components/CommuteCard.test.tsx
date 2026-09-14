import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CommuteCard } from '@/components/Commute/CommuteCard';
import type { CommuteRouteStatus } from '@/hooks/useCommute';

const shell = {
  id: 'commute',
  expanded: false,
  onToggle: vi.fn(),
  onReorder: vi.fn(),
  onMove: vi.fn(),
};

const route = (over: Partial<CommuteRouteStatus> = {}): CommuteRouteStatus => ({
  id: 'r1',
  label: "Krish's school",
  destinationAddress: '456 School Ave',
  arriveByTime: '08:00',
  bufferMinutes: 10,
  familyMemberId: null,
  eventTitlePattern: null,
  originOverride: null,
  matchedEventTitle: null,
  durationInTrafficMin: 20,
  distanceMi: 10,
  leaveByTime: '07:30',
  minutesUntilLeave: 5,
  trafficDelayMin: 5,
  ...over,
});

function renderCard(overrides: Partial<React.ComponentProps<typeof CommuteCard>> = {}) {
  const handlers = {
    onAddRoute: vi.fn(),
    onRemoveRoute: vi.fn(),
    onSetHomeAddress: vi.fn(),
    onSetNoSchoolToday: vi.fn(),
    onDismissSuggestion: vi.fn(),
  };
  render(
    <CommuteCard
      {...shell}
      configured
      homeAddress="123 Home St"
      noSchoolToday={false}
      routes={[]}
      members={[]}
      suggestions={[]}
      loading={false}
      error={null}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

describe('CommuteCard', () => {
  const MONDAY_MORNING = new Date('2026-09-14T07:00:00');
  const MONDAY_MIDDAY = new Date('2026-09-14T12:00:00');
  const SATURDAY_MORNING = new Date('2026-09-19T07:00:00');

  afterEach(() => vi.useRealTimers());

  it('shows a loading spinner', () => {
    renderCard({ loading: true });
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('shows the load error instead of content', () => {
    renderCard({ error: 'network is down' });
    expect(screen.getByText('network is down')).toBeInTheDocument();
  });

  it('shows a no-school message and hides routes when noSchoolToday is set', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_MORNING);
    renderCard({ noSchoolToday: true, routes: [route()] });
    expect(screen.getByText(/nothing to leave for/i)).toBeInTheDocument();
    expect(screen.queryByText("Krish's school")).not.toBeInTheDocument();
  });

  it('prompts for a home address when none is set', () => {
    renderCard({ homeAddress: null });
    expect(screen.getByText(/add a home address/i)).toBeInTheDocument();
  });

  it("shows a 'not connected' message when unconfigured but a home address exists", () => {
    renderCard({ configured: false, homeAddress: '123 Home St' });
    expect(screen.getByText(/set google_maps_api_key/i)).toBeInTheDocument();
  });

  it('shows an empty-routes message', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_MORNING);
    renderCard({ routes: [] });
    expect(screen.getByText(/no routes yet/i)).toBeInTheDocument();
  });

  it('shows an "outside the window" message on a weekday at midday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_MIDDAY);
    renderCard({ routes: [route()] });
    expect(screen.getByText(/outside the school-run window/i)).toBeInTheDocument();
    expect(screen.queryByText(/leave by/i)).not.toBeInTheDocument();
  });

  it('shows an "outside the window" message on a weekend morning', () => {
    vi.useFakeTimers();
    vi.setSystemTime(SATURDAY_MORNING);
    renderCard({ routes: [route()] });
    expect(screen.getByText(/outside the school-run window/i)).toBeInTheDocument();
  });

  it('renders the leave-by time and traffic label inside the school-run window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_MORNING);
    renderCard({ routes: [route()] });
    expect(screen.getByText("Krish's school")).toBeInTheDocument();
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText(/some traffic/i)).toBeInTheDocument();
  });

  it('flags heavy traffic in red at a large delay', () => {
    vi.useFakeTimers();
    vi.setSystemTime(MONDAY_MORNING);
    renderCard({ routes: [route({ trafficDelayMin: 20 })] });
    expect(screen.getByText(/heavy traffic/i)).toBeInTheDocument();
  });

  it('calls onSetNoSchoolToday when the checkbox is toggled', async () => {
    const { onSetNoSchoolToday } = renderCard();
    await userEvent.click(screen.getByRole('checkbox', { name: /no school today/i }));
    expect(onSetNoSchoolToday).toHaveBeenCalledWith(true);
  });

  it('calls onSetHomeAddress when the address form is submitted', async () => {
    const { onSetHomeAddress } = renderCard();
    await userEvent.click(screen.getByText(/manage routes/i));
    const input = screen.getByLabelText(/home address/i);
    await userEvent.clear(input);
    await userEvent.type(input, '999 New St');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSetHomeAddress).toHaveBeenCalledWith('999 New St');
  });

  it('calls onAddRoute when the route form is submitted', async () => {
    const { onAddRoute } = renderCard();
    await userEvent.click(screen.getByText(/manage routes/i));
    await userEvent.type(screen.getByLabelText(/route label/i), "Karishma's school");
    await userEvent.type(screen.getByLabelText(/destination address/i), '789 Primrose Way');
    await userEvent.click(screen.getByRole('button', { name: /add route/i }));
    expect(onAddRoute).toHaveBeenCalledWith({
      label: "Karishma's school",
      destinationAddress: '789 Primrose Way',
      arriveByTime: '08:00',
    });
  });

  it('does not submit a route with a blank label', async () => {
    const { onAddRoute } = renderCard();
    await userEvent.click(screen.getByText(/manage routes/i));
    await userEvent.click(screen.getByRole('button', { name: /add route/i }));
    expect(onAddRoute).not.toHaveBeenCalled();
  });

  it('calls onRemoveRoute from the manage list', async () => {
    const { onRemoveRoute } = renderCard({ routes: [route()] });
    await userEvent.click(screen.getByText(/manage routes/i));
    await userEvent.click(screen.getByRole('button', { name: /remove krish's school/i }));
    expect(onRemoveRoute).toHaveBeenCalledWith('r1');
  });

  describe('T-26', () => {
    const SWIM_SUGGESTION = {
      titlePattern: 'Swim Lessons',
      matchedKeyword: 'swim',
      occurrenceCount: 2,
      nextDate: '2026-09-20',
      suggestedLocation: '123 Pool Rd',
    };

    it('shows a "new" badge and the suggestion prompt when a suggestion exists', async () => {
      renderCard({ suggestions: [SWIM_SUGGESTION] });
      expect(screen.getByText(/1 new/i)).toBeInTheDocument();
      await userEvent.click(screen.getByText(/manage routes/i));
      expect(screen.getByText('Swim Lessons')).toBeInTheDocument();
      expect(screen.getByText(/next 2026-09-20/i)).toBeInTheDocument();
    });

    it('dismisses a suggestion', async () => {
      const { onDismissSuggestion } = renderCard({ suggestions: [SWIM_SUGGESTION] });
      await userEvent.click(screen.getByText(/manage routes/i));
      await userEvent.click(screen.getByRole('button', { name: /not now for swim lessons/i }));
      expect(onDismissSuggestion).toHaveBeenCalledWith('Swim Lessons');
    });

    it('confirming a suggestion switches to event-linked mode and prefills the form', async () => {
      const { onAddRoute } = renderCard({ suggestions: [SWIM_SUGGESTION] });
      await userEvent.click(screen.getByText(/manage routes/i));
      await userEvent.click(screen.getByRole('button', { name: /add a commute/i }));

      expect(screen.getByLabelText(/route label/i)).toHaveValue('Swim Lessons');
      expect(screen.getByLabelText(/destination address/i)).toHaveValue('123 Pool Rd');
      expect(screen.getByLabelText(/calendar event title/i)).toHaveValue('Swim Lessons');

      await userEvent.click(screen.getByRole('button', { name: /add route/i }));
      expect(onAddRoute).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Swim Lessons', destinationAddress: '123 Pool Rd', eventTitlePattern: 'Swim Lessons' }),
      );
      expect(onAddRoute).toHaveBeenCalledWith(expect.not.objectContaining({ arriveByTime: expect.anything() }));
    });

    it('shows a colour dot for a route with a resolvable family member', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-14T07:00:00')); // Monday morning, in-window
      const members = [{ id: 'm1', family_id: 'fam-1', user_id: 'u1', role: 'child' as const, name: 'Karishma', color: 'karishma' }];
      renderCard({
        members,
        routes: [route({ familyMemberId: 'm1' })],
      });
      expect(document.querySelector('span[style*="background-color"]')).toBeInTheDocument();
    });

    it("shows the matched event's title alongside the route label when it differs", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-14T07:00:00'));
      renderCard({
        routes: [route({ eventTitlePattern: 'Swim Lessons', matchedEventTitle: 'Swim Lessons — Week 3' })],
      });
      expect(screen.getByText(/swim lessons — week 3/i)).toBeInTheDocument();
    });

    it('event-linked routes show regardless of the fixed school-run window', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-14T12:00:00')); // midday, outside the fixed window
      renderCard({
        routes: [route({ eventTitlePattern: 'Swim Lessons', matchedEventTitle: 'Swim Lessons', label: "Karishma's swim" })],
      });
      expect(screen.getByText("Karishma's swim")).toBeInTheDocument();
      expect(screen.queryByText(/outside the school-run window/i)).not.toBeInTheDocument();
    });
  });
});
