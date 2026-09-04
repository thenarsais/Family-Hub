import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactOfDayBand } from '@/components/shell/FactOfDayBand';
import { factOfDay } from '@/data/facts';

describe('FactOfDayBand', () => {
  it("shows today's fact and no shuffle control by default", () => {
    render(<FactOfDayBand />);
    expect(screen.getByText(factOfDay())).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /different fact/i })).not.toBeInTheDocument();
  });

  it('lets a parent shuffle to a different fact', async () => {
    const user = userEvent.setup();
    render(<FactOfDayBand canShuffle />);

    const original = factOfDay();
    await user.click(screen.getByRole('button', { name: /different fact/i }));

    // FACTS has plenty of entries, so a shuffle away from the current one
    // should land on something else.
    expect(screen.queryByText(original)).not.toBeInTheDocument();
  });
});
