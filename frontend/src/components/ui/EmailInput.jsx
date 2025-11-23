// src/components/ui/EmailInput.jsx
import { useMemo } from "react";

export function normalizeEmail(v = "") {
  return v.replace(/\s+/g, "").toLowerCase();
}
export function isValidEmail(v = "") {
  const s = normalizeEmail(v);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export default function EmailInput({
  value,
  onChange,
  className = "",
  showHint = true,
  required = false,
  allowAdminBypass = false, // ← добавлено
  ...rest
}) {
  const normalized = useMemo(() => normalizeEmail(value || ""), [value]);

  const valid = useMemo(() => {
    if (allowAdminBypass && normalized === "admin") return true;
    return normalized ? isValidEmail(normalized) : !required;
  }, [normalized, required, allowAdminBypass]);

  return (
    <div>
      <input
        type="text" // важно: text, чтоб "admin" не ругался как email
        inputMode="email"
        autoComplete="email"
        placeholder="E-mail"
        value={normalized}
        onChange={(e) => onChange?.(normalizeEmail(e.target.value))}
        required={required}
        {...rest}
        className={[
          "h-12 w-full rounded-xl",
          "border-2 border-[#1C1A61] bg-white px-4",
          "placeholder:text-[#1C1A61]/60",
          "focus:border-[#1C1A61] focus:ring-0 outline-none transition",
          className,
        ].join(" ")}
      />
      {showHint && normalized && !valid && (
        <p className="mt-1 text-sm text-red-600">
          Укажите корректный e-mail (обязательно с «@» и доменом).
        </p>
      )}
    </div>
  );
}
