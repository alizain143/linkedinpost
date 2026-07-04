type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & {
    length: number;
  };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export type VoiceListener = {
  start: () => void;
  stop: () => void;
};

/**
 * Continuous dictation. Keeps listening until stop() is called.
 * Emits finalized phrases via onFinal and in-progress speech via onInterim.
 */
export function createVoiceListener(options: {
  onFinal: (transcript: string) => void;
  onInterim?: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}): VoiceListener | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let active = false;

  recognition.onresult = (event) => {
    let finalChunk = "";
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const piece = result?.[0]?.transcript ?? "";
      if (result?.isFinal) {
        const trimmed = piece.trim();
        if (trimmed) {
          finalChunk = finalChunk ? `${finalChunk} ${trimmed}` : trimmed;
        }
      } else {
        interim += piece;
      }
    }
    if (finalChunk) {
      options.onFinal(finalChunk);
    }
    // Always push interim (including empty) so the UI clears when a phrase finalizes.
    options.onInterim?.(interim.trim());
  };

  recognition.onerror = (event) => {
    // "no-speech" / "aborted" are normal while holding the session open
    if (event.error === "aborted" || event.error === "no-speech") {
      return;
    }
    active = false;
    options.onError?.(event.error || "Speech recognition failed");
  };

  recognition.onend = () => {
    // Chrome often ends continuous sessions after a pause — restart while active
    if (active) {
      try {
        recognition.start();
        return;
      } catch {
        active = false;
      }
    }
    options.onEnd?.();
  };

  return {
    start: () => {
      active = true;
      recognition.start();
    },
    stop: () => {
      active = false;
      try {
        recognition.stop();
      } catch {
        // already stopped
      }
    },
  };
}
