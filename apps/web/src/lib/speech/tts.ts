export type SpeechPlaybackState = "idle" | "playing" | "paused";

export type SpeakPostParts = {
  hook?: string | null;
  body?: string | null;
  cta?: string | null;
};

type ProsodySegment = {
  text: string;
  rate: number;
  pitch: number;
};

let activeSessionId = 0;
let preferredVoice: SpeechSynthesisVoice | null | undefined;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function splitSentences(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  if (!normalized) return [];

  const chunks = normalized
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return chunks.length > 0 ? chunks : [normalized];
}

function prosodyForSentence(
  sentence: string,
  role: "hook" | "body" | "cta",
): Pick<ProsodySegment, "rate" | "pitch"> {
  const trimmed = sentence.trim();
  const isQuestion = /\?\s*$/.test(trimmed);
  const isExclaim = /!\s*$/.test(trimmed);
  const isShort = trimmed.length > 0 && trimmed.length <= 48;
  const isLong = trimmed.length > 160;

  let rate = 1;
  let pitch = 1;

  if (role === "hook") {
    rate = isShort ? 0.9 : 0.94;
    pitch = 0.96;
  } else if (role === "cta") {
    rate = 0.93;
    pitch = 1.02;
  } else {
    rate = isLong ? 1.06 : isShort ? 0.96 : 1;
    pitch = 1;
  }

  if (isQuestion) {
    rate = Math.min(rate + 0.04, 1.12);
    pitch = Math.min(pitch + 0.18, 1.25);
  } else if (isExclaim) {
    rate = Math.min(rate + 0.06, 1.14);
    pitch = Math.min(pitch + 0.1, 1.18);
  }

  if (/[—–…]|--/.test(trimmed)) {
    rate = Math.max(rate - 0.05, 0.85);
    pitch = Math.max(pitch - 0.04, 0.9);
  }

  if (/\d/.test(trimmed)) {
    rate = Math.max(rate - 0.03, 0.85);
  }

  return { rate, pitch };
}

function buildSegments(parts: SpeakPostParts): ProsodySegment[] {
  const segments: ProsodySegment[] = [];

  const pushRole = (
    text: string | null | undefined,
    role: "hook" | "body" | "cta",
  ) => {
    if (!text?.trim()) return;
    for (const sentence of splitSentences(text)) {
      const { rate, pitch } = prosodyForSentence(sentence, role);
      segments.push({ text: sentence, rate, pitch });
    }
  };

  pushRole(parts.hook, "hook");
  pushRole(parts.body, "body");
  pushRole(parts.cta, "cta");

  return segments;
}

function resolvePreferredVoice(): SpeechSynthesisVoice | null {
  if (preferredVoice !== undefined) return preferredVoice;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    preferredVoice = null;
    return null;
  }

  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  const pool = english.length > 0 ? english : voices;

  const preferredNames = [
    /samantha/i,
    /karen/i,
    /moira/i,
    /daniel/i,
    /google us english/i,
    /google uk english/i,
    /microsoft (aria|jenny|guy|natasha)/i,
    /natural/i,
    /premium/i,
    /enhanced/i,
  ];

  for (const pattern of preferredNames) {
    const match = pool.find((voice) => pattern.test(voice.name));
    if (match) {
      preferredVoice = match;
      return match;
    }
  }

  preferredVoice = pool[0] ?? null;
  return preferredVoice;
}

function queueSegments(
  sessionId: number,
  segments: ProsodySegment[],
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  },
): void {
  if (segments.length === 0) {
    options?.onError?.();
    return;
  }

  const voice = resolvePreferredVoice();
  let index = 0;
  let started = false;

  const speakNext = () => {
    if (sessionId !== activeSessionId) return;

    if (index >= segments.length) {
      options?.onEnd?.();
      return;
    }

    const segment = segments[index];
    index += 1;

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.rate = segment.rate;
    utterance.pitch = segment.pitch;
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (sessionId !== activeSessionId) return;
      if (!started) {
        started = true;
        options?.onStart?.();
      }
    };

    utterance.onend = () => {
      if (sessionId !== activeSessionId) return;
      window.setTimeout(speakNext, index < segments.length ? 180 : 0);
    };

    utterance.onerror = () => {
      if (sessionId !== activeSessionId) return;
      if (index < segments.length) {
        speakNext();
        return;
      }
      options?.onError?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  speakNext();
}

/** Speak a LinkedIn post with browser speechSynthesis and light prosody. */
export function speakPost(
  parts: SpeakPostParts,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  },
): number | null {
  if (!isSpeechSynthesisSupported()) {
    options?.onError?.();
    return null;
  }

  const segments = buildSegments(parts);
  if (segments.length === 0) {
    options?.onError?.();
    return null;
  }

  const sessionId = ++activeSessionId;
  window.speechSynthesis.cancel();

  window.setTimeout(() => {
    if (sessionId !== activeSessionId) return;
    const start = () => queueSegments(sessionId, segments, options);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      const onVoices = () => {
        window.speechSynthesis.onvoiceschanged = null;
        preferredVoice = undefined;
        start();
      };
      window.speechSynthesis.onvoiceschanged = onVoices;
      window.setTimeout(() => {
        if (sessionId !== activeSessionId) return;
        window.speechSynthesis.onvoiceschanged = null;
        start();
      }, 250);
      return;
    }
    preferredVoice = undefined;
    start();
  }, 40);

  return sessionId;
}

export function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: () => void;
  },
): number | null {
  return speakPost({ body: text }, options);
}

export function pauseSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech(): void {
  activeSessionId += 1;
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

export function isSpeechPaused(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.paused;
}
