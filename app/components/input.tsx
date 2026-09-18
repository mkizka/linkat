import type { ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  errors?: string[];
};

export function Input({ label, errors, ...props }: Props) {
  return (
    <div>
      <label className="flex flex-col">
        <div className="flex items-center justify-between px-1 py-2">
          <span className="text-sm text-base-content">{label}</span>
        </div>
        <input className="input" {...props} />
      </label>
      {errors && <p className="p-1 text-sm text-error">{errors}</p>}
    </div>
  );
}
