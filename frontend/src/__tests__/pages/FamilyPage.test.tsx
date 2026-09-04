import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FamilyPage from '@/pages/FamilyPage';

const { mockUseAuth, mockUseFamily } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockUseFamily: vi.fn(),
}));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@hooks/useFamily', () => ({ useFamily: mockUseFamily }));

const baseFamily = {
  createFamily: vi.fn().mockResolvedValue({ id: 'f1' }),
  addChild: vi.fn().mockResolvedValue(undefined),
  inviteMember: vi.fn().mockResolvedValue('tok-123'),
  updateMemberRole: vi.fn().mockResolvedValue(undefined),
  removeMember: vi.fn().mockResolvedValue(undefined),
  updateSettings: vi.fn().mockResolvedValue(undefined),
  loading: false,
  error: null,
  settings: null,
};

function withFamily(overrides: Record<string, unknown>) {
  mockUseFamily.mockReturnValue({ ...baseFamily, ...overrides });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: 'u-priya' } });
});

describe('FamilyPage — no family yet', () => {
  it('shows the create-family form and submits it', async () => {
    const createFamily = vi.fn().mockResolvedValue({ id: 'f1' });
    withFamily({ family: null, members: [], createFamily });
    const user = userEvent.setup();
    render(<FamilyPage />);

    await user.type(screen.getByLabelText(/family name/i), 'The Narsais');
    await user.type(screen.getByLabelText(/description/i), 'Home base');
    await user.click(screen.getByRole('button', { name: /create family/i }));

    expect(createFamily).toHaveBeenCalledWith({ name: 'The Narsais', description: 'Home base' });
  });
});

describe('FamilyPage — existing family', () => {
  const members = [
    { id: 'm1', user_id: 'u-priya', role: 'admin', name: 'Priya', email: 'priya@x.com', joined_at: '2026-01-01' },
    { id: 'm2', user_id: 'u-anand', role: 'parent', name: 'Anand', email: 'anand@x.com', joined_at: '2026-01-02' },
  ];

  it('lists members with names, a role badge and "you"', () => {
    withFamily({ family: { id: 'f1', name: 'The Narsais', description: 'Home' }, members });
    render(<FamilyPage />);

    expect(screen.getByRole('heading', { name: 'The Narsais' })).toBeInTheDocument();
    expect(screen.getByText('Priya')).toBeInTheDocument();
    expect(screen.getByText(/· you/)).toBeInTheDocument();
    expect(screen.getByText('Anand')).toBeInTheDocument();
  });

  it('a parent sees invite + settings; role select is admin-only', () => {
    withFamily({
      family: { id: 'f1', name: 'Fam' },
      members: [{ id: 'm2', user_id: 'u-priya', role: 'parent', name: 'Priya' }],
      settings: { notifications_enabled: true },
    });
    render(<FamilyPage />);

    expect(screen.getByRole('button', { name: /send invite/i })).toBeInTheDocument();
    expect(screen.getByText(/family settings/i)).toBeInTheDocument();
    // parent (not admin) cannot change roles
    expect(screen.queryByLabelText(/^role for/i)).not.toBeInTheDocument();
  });

  it('a child sees the roster but no invite form', () => {
    withFamily({
      family: { id: 'f1', name: 'Fam' },
      members: [{ id: 'm3', user_id: 'u-priya', role: 'child', name: 'Krish' }],
    });
    render(<FamilyPage />);

    expect(screen.getByText('Krish')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send invite/i })).not.toBeInTheDocument();
  });

  it('an admin can change a role and remove another member', async () => {
    const updateMemberRole = vi.fn().mockResolvedValue(undefined);
    const removeMember = vi.fn().mockResolvedValue(undefined);
    withFamily({ family: { id: 'f1', name: 'Fam' }, members, updateMemberRole, removeMember });
    const user = userEvent.setup();
    render(<FamilyPage />);

    await user.selectOptions(screen.getByLabelText(/role for anand/i), 'guardian');
    expect(updateMemberRole).toHaveBeenCalledWith('u-anand', 'guardian');

    await user.click(screen.getByRole('button', { name: /remove anand/i }));
    expect(removeMember).toHaveBeenCalledWith('u-anand');
  });

  it('sends an invitation and shows the token', async () => {
    const inviteMember = vi.fn().mockResolvedValue('tok-abc');
    withFamily({ family: { id: 'f1', name: 'Fam' }, members, inviteMember });
    const user = userEvent.setup();
    render(<FamilyPage />);

    await user.type(screen.getByLabelText(/^email$/i), 'maa@x.com');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    await waitFor(() => expect(inviteMember).toHaveBeenCalledWith('maa@x.com', 'parent'));
    expect(screen.getByText(/tok-abc/)).toBeInTheDocument();
  });

  it('adds a child account through the collapsible form', async () => {
    const addChild = vi.fn().mockResolvedValue(undefined);
    withFamily({ family: { id: 'f1', name: 'Fam' }, members, addChild });
    const user = userEvent.setup();
    render(<FamilyPage />);

    await user.click(screen.getByRole('button', { name: /add a child account/i }));
    await user.type(screen.getByLabelText(/^name$/i), 'Krish');
    await user.type(screen.getByLabelText(/birth year/i), '2016');
    await user.type(screen.getByLabelText(/login email/i), 'krish@x.com');
    await user.type(screen.getByLabelText(/temporary password/i), 'temp1234');
    await user.click(screen.getByRole('button', { name: /^add child$/i }));

    expect(addChild).toHaveBeenCalledWith({
      name: 'Krish',
      email: 'krish@x.com',
      password: 'temp1234',
      birth_year: 2016,
    });
  });

  it('toggles a family setting', async () => {
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    withFamily({
      family: { id: 'f1', name: 'Fam' },
      members: [{ id: 'm2', user_id: 'u-priya', role: 'parent', name: 'Priya' }],
      settings: { notifications_enabled: true, points_system_enabled: false },
      updateSettings,
    });
    const user = userEvent.setup();
    render(<FamilyPage />);

    await user.click(screen.getByLabelText('Notifications'));
    expect(updateSettings).toHaveBeenCalledWith({ notifications_enabled: false });
  });
});
