import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSpeak } from '@/hooks/useSpeak';

class FakeUtterance {
  text: string;
  voice: unknown = null;
  lang = '';
  rate = 1;
  constructor(t: string) {
    this.text = t;
  }
}

function installSynth(voices: Array<{ lang: string; name: string }>) {
  const speak = vi.fn();
  const synth = {
    getVoices: () => voices,
    speak,
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return speak;
}

afterEach(() => vi.unstubAllGlobals());

describe('useSpeak', () => {
  it('reports unsupported when there is no speechSynthesis', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeak());
    expect(result.current.supported).toBe(false);
    // speak is a safe no-op
    expect(() => result.current.speak('અ', 'a')).not.toThrow();
  });

  it('uses a Gujarati voice on the glyph when one exists', () => {
    const speak = installSynth([
      { lang: 'en-US', name: 'English' },
      { lang: 'gu-IN', name: 'Gujarati' },
    ]);
    const { result } = renderHook(() => useSpeak());
    expect(result.current.supported).toBe(true);
    expect(result.current.hasGujaratiVoice).toBe(true);

    result.current.speak('અ', 'a');
    expect(speak).toHaveBeenCalledTimes(1);
    const utt = speak.mock.calls[0][0] as FakeUtterance;
    expect(utt.text).toBe('અ');
    expect(utt.lang).toBe('gu-IN');
  });

  it('falls back to the romanization when no Gujarati voice is installed', () => {
    const speak = installSynth([{ lang: 'en-US', name: 'English' }]);
    const { result } = renderHook(() => useSpeak());
    expect(result.current.hasGujaratiVoice).toBe(false);

    result.current.speak('અ', 'a');
    const utt = speak.mock.calls[0][0] as FakeUtterance;
    expect(utt.text).toBe('a');
    expect(utt.lang).toBe('en-US');
  });
});
