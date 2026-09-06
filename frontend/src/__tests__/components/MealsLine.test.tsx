import { render, screen } from '@testing-library/react';
import { MealsLine } from '@/components/Calendar/MealsLine';
import type { Meal } from '@/hooks/useMealPlanner';

const meal: Meal = {
  date: '2026-08-17',
  day: 'Monday',
  breakfast: 'Oatmeal',
  lunch: 'Chicken salad',
  dinner: 'Pasta primavera',
  snack: 'Apple',
};

describe('MealsLine', () => {
  it('renders nothing without a meal', () => {
    const { container } = render(<MealsLine meal={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when every slot is empty', () => {
    const { container } = render(
      <MealsLine
        meal={{ date: '2026-08-18', day: 'Tue', breakfast: '', lunch: '', dinner: '', snack: '' }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows the dinner as the primary line', () => {
    render(<MealsLine meal={meal} />);
    expect(screen.getByText('Pasta primavera')).toBeInTheDocument();
  });

  it('falls back to lunch, then breakfast, when dinner is missing', () => {
    render(<MealsLine meal={{ ...meal, dinner: '' }} />);
    expect(screen.getByText('Chicken salad')).toBeInTheDocument();
  });

  it('puts all three meals in the tooltip', () => {
    render(<MealsLine meal={meal} />);
    const line = screen.getByText('Pasta primavera').closest('div');
    expect(line).toHaveAttribute(
      'title',
      'Breakfast: Oatmeal\nLunch: Chicken salad\nDinner: Pasta primavera',
    );
  });
});
