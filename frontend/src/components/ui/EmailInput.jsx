import { useMemo } from "react";

export function normalizeEmail(v = "") {
  // убираем пробелы, переводим в нижний регистр
  return v.replace(/\s+/g, "").toLowerCase();
}

// простая, но практичная проверка формата почты
export function isValidEmail(v = "") {
  const s = normalizeEmail(v);
  // должен содержать @ и точку в доменной части
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

export default function EmailInput({
  value,
  onChange,
  className = "",
  showHint = true,
  required = false,
  ...rest
}) {
  const normalized = useMemo(() => normalizeEmail(value || ""), [value]);
  const valid = useMemo(
    () => (normalized ? isValidEmail(normalized) : !required),
    [normalized, required]
  );

  return (
    <div>
      <input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="E-mail"
        value={normalized}
        onChange={(e) => onChange?.(normalizeEmail(e.target.value))}
        required={required}
        className={[
          "h-12 w-full rounded-xl",
          "border-2 border-[#1C1A61] bg-white px-4",
          "placeholder:text-[#1C1A61]/60",
          // никакой красноты и «свечения»
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
