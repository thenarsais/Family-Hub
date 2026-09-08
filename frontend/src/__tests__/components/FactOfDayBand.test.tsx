import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactOfDayBand } from '@/components/shell/FactOfDayBand';
import { factOfDay } from '@/data/facts';
import { FACT_MORE } from '@/data/factDetails';

describe('FactOfDayBand', () => {
  it("shows today's fact and no shuffle control by default", () => {
    render(<FactOfDayBand />);
    expect(screen.getByText(factOfDay().text)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /different fact/i })).not.toBeInTheDocument();
  });

  it('lets a parent shuffle to a different fact', async () => {
    const user = userEvent.setup();
    render(<FactOfDayBand canShuffle />);

    const original = factOfDay().text;
    await user.click(screen.getByRole('button', { name: /different fact/i }));

    expect(screen.queryByText(original)).not.toBeInTheDocument();
  });

  describe('learn more (FR-156)', () => {
    it('expands the blurb on tap and collapses on a second tap', async () => {
      const user = userEvent.setup();
      const today = factOfDay();
      const blurb = FACT_MORE[today.index];
      expect(blurb.length).toBeGreaterThan(0);

      render(<FactOfDayBand />);
      const toggle = screen.getByRole('button', { expanded: false });
      expect(screen.queryByText(blurb, { exact: false })).not.toBeInTheDocument();

      await user.click(toggle);
      expect(await screen.findByText(blurb, { exact: false })).toBeInTheDocument();
      expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { expanded: true }));
      expect(screen.queryByText(blurb, { exact: false })).not.toBeInTheDocument();
    });

    it('collapses on Escape', async () => {
      const user = userEvent.setup();
      const blurb = FACT_MORE[factOfDay().index];
      render(<FactOfDayBand />);

      await user.click(screen.getByRole('button', { expanded: false }));
      await screen.findByText(blurb, { exact: false });

      await user.keyboard('{Escape}');
      expect(screen.queryByText(blurb, { exact: false })).not.toBeInTheDocument();
    });
  });
});
