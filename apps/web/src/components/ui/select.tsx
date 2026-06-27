"use client";

import { MsIcon } from "@/components/ui/ms-icon";
import { cn } from "@/lib/utils";

const selectClass =
  "w-full cursor-pointer appearance-none rounded-[10px] border border-[#e7e9f2] bg-[#f8f9fc] py-2.5 pl-3 pr-10 text-[13.5px] text-[#1e293b] outline-none focus:border-[#4f46e5] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60";

export type SelectOption = string | { value: string; label: string };

function renderOptions(options: readonly SelectOption[]) {
  return options.map((option) => {
    if (typeof option === "string") {
      return (
        <option key={option} value={option}>
          {option}
        </option>
      );
    }
    return (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    );
  });
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  wrapperClassName?: string;
  selectClassName?: string;
  options?: readonly SelectOption[];
  children?: React.ReactNode;
};

export function Select({
  wrapperClassName,
  selectClassName,
  className,
  options,
  children,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", wrapperClassName, className)}>
      <select {...props} className={cn(selectClass, selectClassName)}>
        {options ? renderOptions(options) : children}
      </select>
      <MsIcon
        name="expand_more"
        size={18}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
      />
    </div>
  );
}

type SelectFieldProps = SelectProps & {
  label: string;
  hint?: string;
  fieldClassName?: string;
};

export function SelectField({
  label,
  hint,
  fieldClassName,
  options,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <div className={fieldClassName}>
      <label className="mb-[7px] block text-[12.5px] font-semibold text-[#475569]">
        {label}
        {hint ? (
          <span className="font-normal text-[#94a3b8]"> {hint}</span>
        ) : null}
      </label>
      <Select options={options} {...selectProps}>
        {children}
      </Select>
    </div>
  );
}
