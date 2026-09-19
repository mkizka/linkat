import type { ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  errors?: string[];
};

export function Input({ label, errors, ...props }: Props) {
  return (
    <div>
      <label className="fieldset">
        <span className="label">{label}</span>
        <input className="input" {...props} />
      </label>
      {errors && <p className="p-1 text-sm text-error">{errors}</p>}
    </div>
  );
}
