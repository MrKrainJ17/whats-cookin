import { forwardRef } from "react";

// Labeled text input matching the app's ink-input style. Forwards its
// ref so callers can autofocus the first field on mount.
const AuthInput = forwardRef(function AuthInput(
  { label, hint, error, type = "text", ...rest },
  ref,
) {
  return (
    <label className="block">
      <span className="block font-serif font-semibold text-[15px] text-ink mb-1.5">
        {label}
      </span>
      <input
        ref={ref}
        type={type}
        className={`ink-input ${error ? "border-terracotta" : ""}`}
        {...rest}
      />
      {hint && !error && (
        <span className="block font-body text-xs text-mocha mt-1">{hint}</span>
      )}
      {error && (
        <span className="block font-body text-xs text-terracotta mt-1">
          {error}
        </span>
      )}
    </label>
  );
});

export default AuthInput;
