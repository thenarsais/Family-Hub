import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommuteAlertBand } from '@/components/shell/CommuteAlertBand';

const { mockUseCommute, mockUseFamily } = vi.hoisted(() => ({
  mockUseCommute: vi.fn(),
  mockUseFamily: vi.fn(),
}));

vi.mock('@hooks/useCommute', () => ({ useCommute: mockUseCommute }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));

const route = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'r1',
  label: "Krish's school",
  destinationAddress: '456 School Ave',
  arriveByTime: '08:00',
  bufferMinutes: 10,
  familyMemberId: null,
  eventTitlePattern: null,
  matchedEventTitle: null,
  minutesUntilLeave: 10,
  ...over,
});

function withRoutes(routes: unknown[], members: unknown[] = []) {
  mockUseCommute.mockReturnValue({ summary: { configured: true, homeAddress: '123 Home St', noSchoolToday: false, routes } });
  mockUseFamily.mockReturnValue({ members });
}

describe('CommuteAlertBand', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when no route is leaving soon', () => {
    withRoutes([route({ minutesUntilLeave: 45 })]);
    const { container } = render(<CommuteAlertBand />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when minutesUntilLeave is null (not configured / directions failed)', () => {
    withRoutes([route({ minutesUntilLeave: null })]);
    const { container } = render(<CommuteAlertBand />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a route leaving within the threshold', () => {
    withRoutes([route({ minutesUntilLeave: 12 })]);
    render(<CommuteAlertBand />);
    expect(screen.getByText("Krish's school")).toBeInTheDocument();
    expect(screen.getByText('in 12 min')).toBeInTheDocument();
  });

  it('shows "leave now" once the leave-by moment has passed (within the trailing window)', () => {
    withRoutes([route({ minutesUntilLeave: -2 })]);
    render(<CommuteAlertBand />);
    expect(screen.getByText('leave now')).toBeInTheDocument();
  });

  it('hides a route once well past its leave-by moment', () => {
    withRoutes([route({ minutesUntilLeave: -10 })]);
    const { container } = render(<CommuteAlertBand />);
    expect(container).toBeEmptyDOMElement();
  });

  it('stacks multiple simultaneous leaving-soon trips', () => {
    withRoutes([
      route({ id: 'r1', label: "Krish's dentist", minutesUntilLeave: 5 }),
      route({ id: 'r2', label: "Karishma's swim", minutesUntilLeave: 15 }),
    ]);
    render(<CommuteAlertBand />);
    expect(screen.getByText("Krish's dentist")).toBeInTheDocument();
    expect(screen.getByText("Karishma's swim")).toBeInTheDocument();
  });

  it('prefers the matched event title over the route label for an event-linked trip', () => {
    withRoutes([route({ eventTitlePattern: 'Swim Lessons', matchedEventTitle: 'Swim Lessons', minutesUntilLeave: 8 })]);
    render(<CommuteAlertBand />);
    expect(screen.getByText('Swim Lessons')).toBeInTheDocument();
  });
});
