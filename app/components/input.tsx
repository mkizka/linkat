import type { ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
  label: string;
  errors?: string[];
};

export function Input({ label, errors, ...props }: Props) {
  return (
    <div>
      <label className="form-control">
        <div className="label">
          <span className="label-text">{label}</span>
        </div>
        <input className="input input-bordered" {...props} />
      </label>
      {errors && <p className="p-1 text-sm text-error">{errors}</p>}
    </div>
  );
}
