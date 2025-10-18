import { useMemo, useCallback } from "react";
import { formatRuPhone, normalizeRuDigits, getRuPhoneDigits } from "./PhoneInput";

/** эвристика: содержит «@» или буквы → email */
function looksLikeEmail(v = "") {
  return /@/.test(v) || /[a-zA-Zа-яА-Я]/.test(v);
}

/** Преобразуем ввод: цифры → маска телефона; иначе оставляем текст */
export default function PhoneOrEmailInput({ value, onChange, className = "", ...rest }) {
  const handleChange = useCallback(
    (e) => {
      const raw = e.target.value;
      if (looksLikeEmail(raw)) {
        onChange?.(raw); // e-mail как есть
      } else {
        // цифры/знаки → форматируем телефоном
        onChange?.(formatRuPhone(raw));
      }
    },
    [onChange]
  );

  const placeholder = useMemo(() => "Телефон или e-mail", []);

  return (
    <input
      type="text"
      autoComplete="username"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={handleChange}
      className={[
        "h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white",
        "px-4 placeholder:text-[#1C1A61]/60 outline-none",
        "focus:border-[#EC1822] transition",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}

/** Вытаскиваем в бэк-структуру, чтобы удобно отправлять */
export function parseLoginIdentifier(value = "") {
  if (looksLikeEmail(value)) {
    return { kind: "email", email: value.trim() };
  }
  return { kind: "phone", phone: getRuPhoneDigits(value) }; // "79XXXXXXXXX"
}