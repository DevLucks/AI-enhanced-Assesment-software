import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-500 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900",
              "px-3 py-2.5 leading-tight",
              "placeholder:text-slate-400",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500",
              "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
              icon ? "pl-10" : "",
              error
                ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
