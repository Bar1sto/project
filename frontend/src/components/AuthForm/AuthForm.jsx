import { useState } from "react";
import PhoneOrEmailInput, { parseLoginIdentifier } from "../ui/PhoneOrEmailInput";
import EyeIcon from "../../assets/icons/eye.svg?react";
import EyeOffIcon from "../../assets/icons/eye_off.svg?react";

export default function AuthForm({ isAuth = true }) {
  const [loginId, setLoginId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    const id = parseLoginIdentifier(loginId);
    const payload = id.kind === "email"
      ? { email: id.email, password: pw }
      : { phone: id.phone, password: pw };
    // TODO: отправка на бэк
    // console.log("AUTH payload:", payload);
  };

  return (
    <div className="font-[Actay] max-w-md mx-auto p-6 bg-[#E5E5E5] rounded-xl border border-[#1C1A61]/15">
      <h2 className="text-center text-[55px] font-bold text-[#1C1A61] mb-6">
        {isAuth ? "Авторизация" : "Регистрация"}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <PhoneOrEmailInput value={loginId} onChange={setLoginId} required />

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            placeholder="Пароль"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white pl-4 pr-12 placeholder:text-[#1C1A61]/60 outline-none focus:border-[#EC1822] transition"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-[#1C1A61] hover:text-[#EC1822] transition"
            aria-label={showPw ? "Скрыть пароль" : "Показать пароль"}
          >
            {showPw ? (
              <EyeOffIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
            ) : (
              <EyeIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
            )}
          </button>
        </div>

        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#1C1A61] text-white text-lg font-semibold hover:bg-[#EC1822] transition-colors"
        >
          {isAuth ? "Войти" : "Готово"}
        </button>
      </form>
    </div>
  );
}