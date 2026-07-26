"use client";

import { useRef } from "react";

const OTP_LENGTH = 6;

type OtpDigitInputsProps = {
  digits: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  className?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function OtpDigitInputs({
  digits,
  onChange,
  disabled,
  className = "mb-6",
}: OtpDigitInputsProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))]?.focus();
  };

  const applyCode = (raw: string) => {
    const code = onlyDigits(raw).slice(0, OTP_LENGTH);
    if (!code) return;

    const next = Array.from({ length: OTP_LENGTH }, (_, i) => code[i] ?? "");
    onChange(next);
    focusAt(Math.min(code.length, OTP_LENGTH - 1));
  };

  const updateDigit = (index: number, value: string) => {
    const cleaned = onlyDigits(value);
    if (cleaned.length > 1) {
      applyCode(cleaned);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = digit;
    onChange(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!onlyDigits(pasted)) return;
    e.preventDefault();
    applyCode(pasted);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusAt(index - 1);
    }
  };

  return (
    <div className={`flex justify-center gap-2 ${className}`}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => updateDigit(i, e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-[58px] w-[50px] rounded-xl border border-[#e7e9f2] bg-[#f8f9fc] text-center font-display text-[22px] font-bold text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white disabled:opacity-60"
        />
      ))}
    </div>
  );
}

export { OTP_LENGTH };
