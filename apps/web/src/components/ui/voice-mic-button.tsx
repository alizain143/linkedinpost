"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MsIcon } from "@/components/ui/ms-icon";
import {
  createVoiceListener,
  isSpeechRecognitionSupported,
} from "@/lib/speech/stt";

type VoiceMicButtonProps = {
  /** Current field value; snapshotted when dictation starts. */
  value: string;
  /** Full field value including live (interim) speech. */
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

function joinSpeech(base: string, session: string): string {
  const b = base.trim();
  const s = session.trim();
  if (!b) return s;
  if (!s) return b;
  return `${b} ${s}`;
}

export function VoiceMicButton({
  value,
  onChange,
  disabled,
  className,
}: VoiceMicButtonProps) {
  const [listening, setListening] = useState(false);
  const [livePreview, setLivePreview] = useState("");
  const supported = isSpeechRecognitionSupported();
  const listenerRef = useRef<ReturnType<typeof createVoiceListener>>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const baseTextRef = useRef("");
  const finalsRef = useRef("");
  const interimRef = useRef("");

  const emitLive = () => {
    const session = [finalsRef.current, interimRef.current]
      .filter(Boolean)
      .join(" ");
    setLivePreview(session);
    onChangeRef.current(joinSpeech(baseTextRef.current, session));
  };

  const resetSession = () => {
    baseTextRef.current = "";
    finalsRef.current = "";
    interimRef.current = "";
    setLivePreview("");
  };

  useEffect(() => {
    return () => {
      listenerRef.current?.stop();
    };
  }, []);

  const stopListening = () => {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
    // Final emit already applied live; clear session bookkeeping.
    resetSession();
  };

  const startListening = () => {
    baseTextRef.current = valueRef.current;
    finalsRef.current = "";
    interimRef.current = "";
    setLivePreview("");

    const listener = createVoiceListener({
      onFinal: (transcript) => {
        finalsRef.current = finalsRef.current
          ? `${finalsRef.current} ${transcript}`
          : transcript;
        interimRef.current = "";
        emitLive();
      },
      onInterim: (transcript) => {
        interimRef.current = transcript;
        emitLive();
      },
      onError: (message) => {
        setListening(false);
        listenerRef.current = null;
        resetSession();
        if (message && message !== "no-speech") {
          // keep UI quiet for benign errors
        }
      },
      onEnd: () => {
        setListening(false);
        listenerRef.current = null;
        resetSession();
      },
    });
    if (!listener) return;
    listenerRef.current = listener;
    listener.start();
    setListening(true);
  };

  if (!supported) {
    return (
      <span title="Voice input is not supported in this browser">
        <Button
          type="button"
          variant="icon"
          size="icon"
          disabled
          aria-label="Voice input not supported"
          className={className}
        >
          <MsIcon name="mic_off" size={18} className="text-[#94a3b8]" />
        </Button>
      </span>
    );
  }

  return (
    <div className="inline-flex max-w-full flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1.5">
        <span title={listening ? "Listening…" : "Speak to type"}>
          <Button
            type="button"
            variant={listening ? "selected" : "icon"}
            size="icon"
            disabled={disabled || listening}
            onClick={startListening}
            aria-pressed={listening}
            aria-label={listening ? "Listening" : "Start voice input"}
            className={className}
          >
            <MsIcon
              name={listening ? "mic" : "mic_none"}
              size={18}
              className={
                listening
                  ? "animate-pulse text-[#4f46e5]"
                  : "text-[#475569]"
              }
            />
          </Button>
        </span>
        {listening ? (
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={stopListening}
            aria-label="Done dictating"
          >
            Done
          </Button>
        ) : null}
      </span>
      {listening && livePreview ? (
        <p
          className="max-w-[min(100vw-2rem,20rem)] rounded-lg border border-[#ddd6fe] bg-[#f5f3ff] px-2.5 py-1.5 text-left text-[12px] leading-snug text-[#4338ca]"
          aria-live="polite"
        >
          {livePreview}
        </p>
      ) : listening ? (
        <p className="text-[11px] font-medium text-[#94a3b8]" aria-live="polite">
          Listening…
        </p>
      ) : null}
    </div>
  );
}
