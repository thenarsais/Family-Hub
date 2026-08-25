import { render, screen } from '@testing-library/react';
import ActivityBoard from '@/pages/ActivityBoard';

describe('ActivityBoard', () => {
  it('should render the heading and each activity card', () => {
    render(<ActivityBoard />);

    expect(screen.getByRole('heading', { name: /activity board/i })).toBeInTheDocument();
    ['Games', 'Trivia', 'Homework', 'Kung Fu', 'Habits', 'Reading'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: /start activity/i })).toHaveLength(6);
  });
});
