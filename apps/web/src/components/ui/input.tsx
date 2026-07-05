import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

export type InputVariant = "app" | "app-sm" | "auth" | "auth-icon" | "marketing" | "modal" | "search";

const inputVariants: Record<InputVariant, string> = {
  app: "w-full rounded-[10px] border border-[#e7e9f2] bg-[#f8f9fc] px-3 py-2.5 text-[13.5px] text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  "app-sm":
    "w-full rounded-[10px] border border-[#e7e9f2] bg-[#f8f9fc] px-3 py-2 text-sm text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  auth: "w-full rounded-[11px] border border-[#e7e9f2] bg-[#f8f9fc] py-[11px] px-[13px] text-sm text-[#1e293b] outline-none transition-colors focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  "auth-icon":
    "w-full rounded-[11px] border border-[#e7e9f2] bg-[#f8f9fc] py-[11px] pl-10 pr-[13px] text-sm text-[#1e293b] outline-none transition-colors focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  marketing:
    "w-full rounded-[11px] border border-[#e7e9f2] bg-[#f8f9fc] px-[13px] py-[11px] text-sm text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60",
  modal:
    "w-full rounded-[10px] border border-[#e7e9f2] bg-[#f8f9fc] px-3 py-2.5 text-[13.5px] text-[#1e293b] outline-none read-only:cursor-default",
  search:
    "w-full border-none bg-transparent text-[13.5px] text-[#1e293b] outline-none placeholder:text-[#94a3b8]",
};

const labelClass = "mb-[7px] block text-[12.5px] font-semibold text-[#475569]";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: InputVariant;
  inputClassName?: string;
};

export function Input({
  variant = "app",
  className,
  inputClassName,
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={cn(inputVariants[variant], inputClassName, className)}
    />
  );
}

type InputFieldProps = InputProps & {
  label: string;
  hint?: string;
  labelAside?: React.ReactNode;
  fieldClassName?: string;
  icon?: string;
};

export function InputField({
  label,
  hint,
  labelAside,
  fieldClassName,
  icon,
  variant = "app",
  inputClassName,
  className,
  ...props
}: InputFieldProps) {
  const resolvedVariant = icon ? "auth-icon" : variant;

  return (
    <div className={fieldClassName}>
      <div
        className={cn(
          "mb-[7px]",
          labelAside ? "flex items-center justify-between gap-2" : "block",
        )}
      >
        <label className={cn(labelClass, labelAside && "mb-0")}>
          {label}
          {hint ? <span className="font-normal text-[#94a3b8]"> {hint}</span> : null}
        </label>
        {labelAside}
      </div>
      {icon ? (
        <div className="relative">
          <MsIcon
            name={icon}
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          />
          <Input
            variant={resolvedVariant}
            inputClassName={inputClassName}
            className={className}
            {...props}
          />
        </div>
      ) : (
        <Input
          variant={resolvedVariant}
          inputClassName={inputClassName}
          className={className}
          {...props}
        />
      )}
    </div>
  );
}

type TextareaFieldProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  labelAside?: React.ReactNode;
  fieldClassName?: string;
  variant?: InputVariant;
  textareaClassName?: string;
};

export function TextareaField({
  label,
  hint,
  labelAside,
  fieldClassName,
  variant = "app",
  textareaClassName,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <div className={fieldClassName}>
      <div
        className={cn(
          "mb-[7px]",
          labelAside ? "flex items-center justify-between gap-2" : "block",
        )}
      >
        <label className={cn(labelClass, labelAside && "mb-0")}>
          {label}
          {hint ? <span className="font-normal text-[#94a3b8]"> {hint}</span> : null}
        </label>
        {labelAside}
      </div>
      <textarea
        {...props}
        className={cn(
          inputVariants[variant],
          "resize-none",
          textareaClassName,
          className,
        )}
      />
    </div>
  );
}
