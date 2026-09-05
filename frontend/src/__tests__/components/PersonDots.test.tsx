import { render } from '@testing-library/react';
import { PersonDots } from '@/components/Calendar/PersonDots';
import type { components } from '@/types/api-generated';

type FamilyMember = components['schemas']['FamilyMember'];

const members = [
  { id: 'm1', family_id: 'f1', user_id: 'u1', role: 'parent', name: 'Anand', color: 'anand' },
  { id: 'm2', family_id: 'f1', user_id: 'u2', role: 'child', name: 'Krish', color: 'krish' },
  { id: 'm3', family_id: 'f1', user_id: 'u3', role: 'child', name: 'Priya', color: null },
] as FamilyMember[];

describe('PersonDots', () => {
  it('renders nothing when there are no people', () => {
    const { container } = render(<PersonDots people={[]} members={members} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when people is undefined', () => {
    const { container } = render(<PersonDots people={undefined} members={members} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one dot per resolvable assignment with a name/role title', () => {
    const { container, getByTitle } = render(
      <PersonDots
        people={[
          { familyMemberId: 'm1', role: 'going' },
          { familyMemberId: 'm2', role: 'maybe' },
        ]}
        members={members}
      />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(2);
    expect(getByTitle('Anand — Going')).toBeInTheDocument();
    expect(getByTitle('Krish — Maybe')).toBeInTheDocument();
  });

  it('dims a "maybe" dot to 45% opacity and keeps "going" solid', () => {
    const { getByTitle } = render(
      <PersonDots
        people={[
          { familyMemberId: 'm1', role: 'going' },
          { familyMemberId: 'm2', role: 'maybe' },
        ]}
        members={members}
      />,
    );
    expect(getByTitle('Anand — Going')).toHaveStyle({ opacity: '1' });
    expect(getByTitle('Krish — Maybe')).toHaveStyle({ opacity: '0.45' });
  });

  it('orders Going dots before Maybe dots regardless of input order', () => {
    const { container } = render(
      <PersonDots
        people={[
          { familyMemberId: 'm2', role: 'maybe' },
          { familyMemberId: 'm1', role: 'going' },
        ]}
        members={members}
      />,
    );
    const titles = [...container.querySelectorAll('span[title]')].map((el) => el.getAttribute('title'));
    expect(titles).toEqual(['Anand — Going', 'Krish — Maybe']);
  });

  it('skips an assignment whose member is not in the roster', () => {
    const { container } = render(
      <PersonDots
        people={[
          { familyMemberId: 'gone', role: 'going' },
          { familyMemberId: 'm1', role: 'going' },
        ]}
        members={members}
      />,
    );
    expect(container.querySelectorAll('span[title]')).toHaveLength(1);
  });
});
