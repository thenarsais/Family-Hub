import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKiosk } from '@hooks/useKiosk';
import { useClock, formatClockDate, formatClockTime } from '@hooks/useClock';
import { useWeather } from '@hooks/useWeather';
import { resolveMemberColor } from '@/data/familyColors';
import PinPad from '@components/kiosk/PinPad';

const isParentRole = (role: string) => role === 'parent' || role === 'admin';

/**
 * The shared-display attract screen: shown when the device is in kiosk mode with
 * no profile selected (fresh boot, or after the idle timeout). Clock, weather,
 * and the big "tap your name" picker.
 */
export default function KioskHome() {
  const { profiles, familyName, hasPin, switchProfile, unlockParent } = useKiosk();
  const navigate = useNavigate();
  const now = useClock();
  const { weather, location } = useWeather();
  const [pinFor, setPinFor] = useState<string | null>(null);

  const temp = weather?.current?.temp;

  const pick = (userId: string, role: string) => {
    if (isParentRole(role) && hasPin) {
      setPinFor(userId);
      return;
    }
    switchProfile(userId);
    navigate('/dashboard');
  };

  return (
    <main className="container py-10 max-w-3xl text-center">
      <p className="font-display text-6xl font-bold tabular-nums text-ink">{formatClockTime(now)}</p>
      <p className="text-lg text-ink-2 mt-1">{formatClockDate(now)}</p>
      {typeof temp === 'number' && (
        <p className="text-base text-ink-3 mt-1">
          <span aria-hidden="true">{weather?.current?.icon ?? ''}</span> {Math.round(temp)}° ·{' '}
          {location}
        </p>
      )}

      <h1 className="font-display text-2xl font-bold text-ink mt-10 mb-6">
        {familyName ? `${familyName} — tap your name` : 'Tap your name'}
      </h1>

      {profiles.length === 0 ? (
        <p className="text-ink-3">Setting up…</p>
      ) : (
        <ul className="flex flex-wrap justify-center gap-5">
          {profiles.map((p, i) => {
            const color = resolveMemberColor(p.color, i);
            return (
              <li key={p.userId}>
                <button
                  type="button"
                  onClick={() => pick(p.userId, p.role)}
                  className="flex flex-col items-center gap-2 rounded-2xl p-4 border-2 border-transparent hover:border-accent hover:bg-accent-soft active:scale-95 transition"
                >
                  <span
                    className="w-24 h-24 rounded-full grid place-items-center text-4xl font-display font-bold text-white"
                    style={{ backgroundColor: color.hex }}
                    aria-hidden="true"
                  >
                    {(p.name.trim()[0] ?? '?').toUpperCase()}
                  </span>
                  <span className="text-lg font-medium text-ink">{p.name.split(' ')[0]}</span>
                </button>
              </li>
            );
          })}
        </ul>
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
    </main>
  );
}
