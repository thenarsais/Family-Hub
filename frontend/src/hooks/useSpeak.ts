import { useCallback, useEffect, useState } from 'react';

/**
 * Best-effort "hear it" for the learning module (T-11). Real per-lesson audio
 * is FR-041 (deferred); this uses the browser's speech synthesis where it can:
 * a Gujarati voice reads `text`, otherwise the default voice reads the
 * romanization. `supported` is false when there's no speechSynthesis at all
 * (jsdom, older browsers) — hide the button then.
 */
export function useSpeak() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  const supported = !!synth;
  const [guVoice, setGuVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!synth) return;
    const load = () => {
      const voices = synth.getVoices();
      setGuVoice(voices.find((v) => v.lang?.toLowerCase().startsWith('gu')) ?? null);
    };
    load();
    synth.addEventListener?.('voiceschanged', load);
    return () => synth.removeEventListener?.('voiceschanged', load);
  }, [synth]);

  const speak = useCallback(
    (text: string, romanization?: string) => {
      if (!synth) return;
      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(guVoice ? text : romanization ?? text);
        if (guVoice) {
          utterance.voice = guVoice;
          utterance.lang = guVoice.lang;
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = 0.85;
        synth.speak(utterance);
      } catch {
        /* speech unavailable at call time — no-op */
      }
    },
    [synth, guVoice],
  );

  return { supported, hasGujaratiVoice: !!guVoice, speak };
}
