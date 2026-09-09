import { useCallback, useEffect, useState } from 'react';
import { Monitor, Trash2 } from 'lucide-react';
import { apiClient } from '@services/api';
import { useKiosk } from '@hooks/useKiosk';
import type { components } from '@/types/api-generated';

type KioskDevice = components['schemas']['KioskDevice'];

interface Props {
  /** family_settings.has_pin from useFamily(). */
  hasPin: boolean;
  idleMinutes: number;
  onChangeIdle: (minutes: number) => void;
  /** Re-fetch family settings after a PIN change. */
  onPinChanged: () => void;
}

/** Family-display (kiosk) management, shown on /family for parents. */
export default function KioskSettings({ hasPin, idleMinutes, onChangeIdle, onPinChanged }: Props) {
  const { isKiosk, enroll, leaveKiosk } = useKiosk();
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pinEntry, setPinEntry] = useState<string | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const res = await apiClient.get<{ devices: KioskDevice[] }>('/api/kiosk/devices');
      setDevices(res.data?.devices ?? []);
    } catch {
      /* parent-only; ignore for non-parents who somehow reach here */
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const runEnroll = async () => {
    setBusy(true);
    setErr(null);
    try {
      await enroll('Family display');
      window.location.assign('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not set up this device');
      setBusy(false);
    }
  };

  const stopKiosk = () => {
    leaveKiosk();
    window.location.assign('/login');
  };

  const revoke = async (id: string) => {
    await apiClient.delete(`/api/kiosk/devices/${id}`).catch(() => undefined);
    void loadDevices();
  };

  const savePin = async () => {
    if (!pinEntry || !/^\d{4}$/.test(pinEntry)) {
      setErr('PIN must be 4 digits');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await apiClient.put('/api/kiosk/pin', { pin: pinEntry });
      setPinEntry(null);
      onPinChanged();
    } catch {
      setErr('Could not save the PIN');
    } finally {
      setBusy(false);
    }
  };

  const removePin = async () => {
    setBusy(true);
    try {
      await apiClient.delete('/api/kiosk/pin');
      onPinChanged();
    } catch {
      setErr('Could not remove the PIN');
    } finally {
      setBusy(false);
    }
  };

  const commitIdle = (e: React.FocusEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (Number.isFinite(n) && n >= 1 && n <= 120 && n !== idleMinutes) onChangeIdle(n);
    else e.target.value = String(idleMinutes);
  };

  return (
    <section className="card">
      <h2 className="font-display text-xl font-bold text-ink mb-1 flex items-center gap-2">
        <Monitor className="w-5 h-5 text-accent" aria-hidden="true" /> Family display
      </h2>
      <p className="text-sm text-ink-3 mb-4">
        Run this app as a shared wall display: family members tap their face, and the Parent
        profile is protected by a PIN.
      </p>

      {err && <p className="text-sm text-alert bg-alert/10 rounded p-2 mb-3">{err}</p>}

      {/* This device */}
      <div className="mb-5">
        {isKiosk ? (
          <button type="button" className="btn btn-secondary btn-small" onClick={stopKiosk}>
            Stop using this device as the display
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-small"
            onClick={runEnroll}
            disabled={busy}
          >
            {busy ? 'Setting up…' : 'Use this device as the family display'}
          </button>
        )}
      </div>

      {/* PIN */}
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-ink mb-2">
          Parent PIN {hasPin ? <span className="text-ink-3 font-normal">· set</span> : null}
        </h3>
        {pinEntry === null ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setPinEntry('')}
            >
              {hasPin ? 'Change PIN' : 'Set a PIN'}
            </button>
            {hasPin && (
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={removePin}
                disabled={busy}
              >
                Remove PIN
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              className="input tracking-[0.5em] text-center"
              style={{ width: '7rem' }}
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={pinEntry}
              onChange={(e) => setPinEntry(e.target.value.replace(/\D/g, '').slice(0, 4))}
              aria-label="New 4-digit PIN"
            />
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={savePin}
              disabled={busy}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setPinEntry(null);
                setErr(null);
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Idle timeout */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-ink flex items-center gap-2">
          Return to the picker after
          <input
            key={idleMinutes}
            type="number"
            min={1}
            max={120}
            className="input"
            style={{ width: '4.5rem' }}
            defaultValue={idleMinutes}
            onBlur={commitIdle}
            aria-label="Idle minutes before the display resets"
          />
          minutes of no activity
        </label>
      </div>

      {/* Registered displays */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-2">
          Registered displays <span className="text-ink-3 font-normal">({devices.length})</span>
        </h3>
        {devices.length === 0 ? (
          <p className="text-sm text-ink-3">None yet.</p>
        ) : (
          <ul className="divide-y divide-rule">
            {devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1 text-ink">{d.label}</span>
                <span className="text-ink-3 text-xs">
                  {d.lastSeenAt ? `seen ${new Date(d.lastSeenAt).toLocaleDateString()}` : 'never seen'}
                </span>
                <button
                  type="button"
                  aria-label={`Revoke ${d.label}`}
                  className="p-1.5 text-ink-3 hover:text-alert"
                  onClick={() => revoke(d.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
