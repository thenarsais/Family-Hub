import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useKiosk } from '@hooks/useKiosk';
import { resolveMemberColor } from '@/data/familyColors';
import PinPad from './PinPad';

const isParentRole = (role: string) => role === 'parent' || role === 'admin';

/**
 * The always-on family switcher for a shared display. Kids tap their face to see
 * their day; the Parent face is PIN-gated (when a PIN is set). The lock button
 * drops back to the attract screen.
 */
export default function ProfileBar() {
  const { profiles, activeProfileId, hasPin, switchProfile, unlockParent, revert } = useKiosk();
  const navigate = useNavigate();
  const [pinFor, setPinFor] = useState<string | null>(null);

  if (profiles.length === 0) return null;

  const pick = (userId: string, role: string) => {
    if (isParentRole(role) && hasPin) {
      setPinFor(userId);
      return;
    }
    switchProfile(userId);
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {profiles.map((p, i) => {
          const color = resolveMemberColor(p.color, i);
          const active = p.userId === activeProfileId;
          return (
            <button
              key={p.userId}
              type="button"
              onClick={() => pick(p.userId, p.role)}
              aria-pressed={active}
              title={p.name}
              className={`flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 border-2 transition ${
                active ? 'border-accent bg-accent-soft' : 'border-transparent hover:bg-accent-soft'
              }`}
            >
              <span
                className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white"
                style={{ backgroundColor: color.hex }}
                aria-hidden="true"
              >
                {(p.name.trim()[0] ?? '?').toUpperCase()}
              </span>
              <span className="text-sm font-medium text-ink hidden sm:block">
                {p.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {activeProfileId && (
        <button
          type="button"
          onClick={() => {
            revert();
            navigate('/');
          }}
          aria-label="Lock the display"
          className="p-2 rounded-lg text-ink-3 hover:text-accent hover:bg-accent-soft transition"
        >
          <Lock className="w-4 h-4" />
        </button>
      )}

      {pinFor && (
        <PinPad
          onSubmit={async (pin) => {
            await unlockParent(pin);
            setPinFor(null);
            navigate('/dashboard');
          }}
          onCancel={() => setPinFor(null)}
        />
      )}
    </div>
  );
}
