import { useState } from 'react';
import { Delete, X } from 'lucide-react';

interface Props {
  /** Resolves on a correct PIN; rejects to trigger the shake + message. */
  onSubmit: (pin: string) => Promise<void>;
  onCancel: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Full-screen on-screen keypad for the family PIN. Auto-submits at 4 digits. */
export default function PinPad({ onSubmit, onCancel }: Props) {
  const [digits, setDigits] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (pin: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await onSubmit(pin);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setMessage(
        status === 429
          ? 'Too many tries — wait a few minutes.'
          : 'That PIN didn’t work. Try again.',
      );
      setShake(true);
      setDigits('');
      window.setTimeout(() => setShake(false), 400);
    } finally {
      setBusy(false);
    }
  };

  const press = (k: string) => {
    if (busy || digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) void submit(next);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enter the family PIN"
    >
      <div
        className={`bg-raised rounded-2xl shadow-xl w-full max-w-xs p-6 text-center ${
          shake ? 'animate-pop' : ''
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-ink">Parent PIN</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel"
            className="text-ink-3 hover:text-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-4 w-4 rounded-full border-2 ${
                i < digits.length ? 'bg-accent border-accent' : 'border-rule'
              }`}
            />
          ))}
        </div>

        {message && <p className="text-sm text-alert mb-4">{message}</p>}

        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => press(k)}
              disabled={busy}
              className="aspect-square rounded-xl border-2 border-rule bg-paper text-2xl font-display font-bold text-ink hover:border-accent active:scale-95 disabled:opacity-50 transition"
            >
              {k}
            </button>
          ))}
          <span aria-hidden="true" />
          <button
            type="button"
            onClick={() => press('0')}
            disabled={busy}
            className="aspect-square rounded-xl border-2 border-rule bg-paper text-2xl font-display font-bold text-ink hover:border-accent active:scale-95 disabled:opacity-50 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setDigits((d) => d.slice(0, -1))}
            disabled={busy || digits.length === 0}
            aria-label="Delete"
            className="aspect-square rounded-xl border-2 border-rule bg-paper grid place-items-center text-ink-2 hover:border-accent active:scale-95 disabled:opacity-40 transition"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
