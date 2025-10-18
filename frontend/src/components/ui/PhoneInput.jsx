import { useCallback } from "react";

/** Оставляем только цифры; приводим 8 → 7; ограничиваем до 11 цифр */
export function normalizeRuDigits(input) {
  let d = (input || "").replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (!d.startsWith("7")) d = "7" + d;       // если ввели с 9/0 и т.п.
  return d.slice(0, 11);
}

/** Форматируем в «+7 (XXX) XXX-XX-XX» по мере ввода */
export function formatRuPhone(digits) {
  const d = normalizeRuDigits(digits);
  const a = d.slice(1, 4);
  const b = d.slice(4, 7);
  const c = d.slice(7, 9);
  const e = d.slice(9, 11);

  let res = "+7";
  if (a) res += ` (${a}`;
  if (a.length === 3) res += `)`;
  if (b) res += ` ${b}`;
  if (c) res += `-${c}`;
  if (e) res += `-${e}`;
  return res;
}

/** Достаём «чистые» цифры для бэка (11 цифр, первая всегда 7) */
export function getRuPhoneDigits(masked) {
  return normalizeRuDigits(masked);
}

/**
 * Контролируемый инпут с маской RU.
 * Props:
 *  - value: string (masked)
 *  - onChange: (masked: string) => void
 *  - name, required, className, autoFocus, etc — как у обычного input
 */
export default function PhoneInput({
  value,
  onChange,
  className = "",
  ...rest
}) {
  const handleChange = useCallback(
    (e) => {
      const masked = formatRuPhone(e.target.value);
      onChange?.(masked);
    },
    [onChange]
  );

  const handleFocus = useCallback(
    (e) => {
      if (!value) {
        onChange?.("+7");
        // курсор уйдёт в конец автоматически
      }
      rest.onFocus?.(e);
    },
    [value, onChange, rest]
  );

  return (
    <input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 (___) ___-__-__"
      value={value ?? ""}
      onChange={handleChange}
      onFocus={handleFocus}
      maxLength={18} /* чтобы не расползалось за формат */
      className={[
        // базовые стили под твой дизайн:
        "h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white",
        "px-4 placeholder:text-[#1C1A61]/60 outline-none",
        " transition",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}