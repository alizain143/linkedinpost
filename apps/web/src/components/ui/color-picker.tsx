import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const labelClass = "mb-[7px] block text-[12.5px] font-semibold text-[#475569]";

const HEX_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) {
    return null;
  }

  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

function toColorInputValue(hex: string): string {
  return normalizeHexColor(hex) ?? "#808080";
}

type ColorPickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fieldClassName?: string;
};

export function ColorPickerField({
  label,
  value,
  onChange,
  placeholder = "#000000",
  disabled,
  fieldClassName,
}: ColorPickerFieldProps) {
  const normalized = normalizeHexColor(value);
  const swatchColor = normalized ?? "#f8f9fc";

  return (
    <div className={fieldClassName}>
      <label className={labelClass}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <div
            aria-hidden
            className={cn(
              "pointer-events-none h-[42px] w-[42px] rounded-[10px] border",
              normalized
                ? "border-[#e7e9f2]"
                : "border-dashed border-[#cbd5e1] bg-[#f8f9fc]",
            )}
            style={normalized ? { backgroundColor: swatchColor } : undefined}
          />
          <input
            type="color"
            value={toColorInputValue(value)}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            aria-label={`${label} color picker`}
            className="absolute inset-0 h-full w-full cursor-pointer rounded-[10px] border-0 bg-transparent p-0 opacity-0 disabled:cursor-not-allowed"
          />
        </div>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => {
            const next = normalizeHexColor(value);
            if (next && next !== value) {
              onChange(next);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          className="min-w-0 flex-1 font-mono uppercase"
        />
      </div>
    </div>
  );
}
