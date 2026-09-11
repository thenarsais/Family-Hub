import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KungFuManagePanel from '@/components/activity/KungFuManagePanel';

const FAMILY_PROFILES = [
  { userId: 'u1', name: 'Krish', belt: 'Yellow Sash', beltSince: '2026-06-01', pointsPerClass: 15, pointsPerPractice: 5 },
  { userId: 'u2', name: 'Karishma', belt: null, beltSince: null, pointsPerClass: 15, pointsPerPractice: 5 },
];

function setup(over: { familyProfiles?: unknown[] } = {}) {
  const updateProfile = vi.fn().mockResolvedValue(undefined);
  const onLoad = vi.fn();
  render(
    <KungFuManagePanel
      familyProfiles={(over.familyProfiles ?? FAMILY_PROFILES) as never}
      onLoad={onLoad}
      updateProfile={updateProfile}
    />,
  );
  return { updateProfile, onLoad };
}

beforeEach(() => vi.clearAllMocks());

describe('KungFuManagePanel', () => {
  it('loads the family list on mount', () => {
    const { onLoad } = setup();
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it('lists each member with their current belt + points', () => {
    setup();
    expect(screen.getByText(/yellow sash · \+15\/class · \+5\/practice/i)).toBeInTheDocument();
    expect(screen.getByText(/no belt · \+15\/class · \+5\/practice/i)).toBeInTheDocument();
  });

  it("edits a member's belt and points inline", async () => {
    const { updateProfile } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit karishma's kung fu profile/i }));
    fireEvent.change(screen.getByLabelText('Karishma belt'), { target: { value: 'Orange Sash' } });
    fireEvent.change(screen.getByLabelText('Karishma points per class'), { target: { value: '20' } });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(updateProfile).toHaveBeenCalledWith('u2', {
      belt: 'Orange Sash',
      beltSince: null,
      pointsPerClass: 20,
      pointsPerPractice: 5,
    });
  });

  it('cancels an inline edit without saving', async () => {
    const { updateProfile } = setup();
    await userEvent.click(screen.getByRole('button', { name: /edit krish's kung fu profile/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument();
  });

  it('renders the empty state with no family members', () => {
    setup({ familyProfiles: [] });
    expect(screen.getByText(/no family members yet/i)).toBeInTheDocument();
  });
});
