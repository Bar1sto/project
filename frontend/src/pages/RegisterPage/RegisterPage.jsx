import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import EmailInput, { isValidEmail, normalizeEmail } from "../../components/ui/EmailInput";
import PhoneInput, { getRuPhoneDigits } from "../../components/ui/PhoneInput";
import EyeIcon from "../../assets/icons/eye.svg?react";
import EyeOffIcon from "../../assets/icons/eye_off.svg?react";

export default function RegisterPage() {
  const [isLogin, setIsLogin] = useState(false);

  // регистрация
  const [regLastName, setRegLastName] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPw1, setRegPw1] = useState("");
  const [regPw2, setRegPw2] = useState("");
  const [showRegPw1, setShowRegPw1] = useState(false);
  const [showRegPw2, setShowRegPw2] = useState(false);

  // авторизация
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // валидация для блокировки кнопок
  const canSubmitRegister = useMemo(
    () =>
      regLastName.trim() &&
      regFirstName.trim() &&
      isValidEmail(regEmail) &&
      getRuPhoneDigits(regPhone)?.length === 11 &&
      regPw1.length >= 6 &&
      regPw1 === regPw2,
    [regLastName, regFirstName, regEmail, regPhone, regPw1, regPw2]
  );

  const canSubmitLogin = useMemo(
    () => isValidEmail(loginEmail) && loginPw.length >= 1,
    [loginEmail, loginPw]
  );

  const submitRegister = (e) => {
    e.preventDefault();
    if (!canSubmitRegister) return;

    const payload = {
      last_name: regLastName.trim(),
      first_name: regFirstName.trim(),
      email: normalizeEmail(regEmail),
      phone: getRuPhoneDigits(regPhone), // 79XXXXXXXXX
      password1: regPw1,
      password2: regPw2,
    };
    // TODO: отправка на бэк
    // console.log("REGISTER:", payload);
  };

  const submitLogin = (e) => {
    e.preventDefault();
    if (!canSubmitLogin) return;

    const payload = {
      email: normalizeEmail(loginEmail),
      password: loginPw,
    };
    // TODO: отправка на бэк
    // console.log("LOGIN:", payload);
  };

  return (
    <div className="font-[Actay] max-w-[1200px] mx-auto px-5 py-5 min-h-[calc(100vh-80px)] text-[#1C1A61]">
      {/* крошки */}
      <div className="mb-8 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">Главная</Link>
        <span className="mx-1">/</span>
        <span>Личный кабинет</span>
      </div>

      <div className="max-w-[520px] mx-auto">
        <h1 className="text-center font-bold mb-8 text-[55px] leading-[1.05]">
          {isLogin ? "Авторизация" : "Регистрация"}
        </h1>

        {/* формы */}
        {!isLogin ? (
          <form onSubmit={submitRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Фамилия"
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
              required
              className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white px-4 placeholder:text-[#1C1A61]/60 outline-none  transition"
              autoComplete="family-name"
            />
            <input
              type="text"
              placeholder="Имя"
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
              required
              className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white px-4 placeholder:text-[#1C1A61]/60 outline-none  transition"
              autoComplete="given-name"
            />

            {/* email с «маской/валидацией» */}
            <EmailInput value={regEmail} onChange={setRegEmail} required />

            {/* телефон с маской +7 */}
            <PhoneInput value={regPhone} onChange={setRegPhone} required />


            {/* пароль */}
            <div className="relative">
              <input
                type={showRegPw1 ? "text" : "password"}
                placeholder="Пароль"
                value={regPw1}
                onChange={(e) => setRegPw1(e.target.value)}
                required
                className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white pl-4 pr-12 placeholder:text-[#1C1A61]/60 outline-none transition"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowRegPw1((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-[#1C1A61] transition"
                aria-label={showRegPw1 ? "Скрыть пароль" : "Показать пароль"}
              >
                {showRegPw1 ? (
                  <EyeOffIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                ) : (
                  <EyeIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                )}
              </button>
            </div>

            {/* повтор пароля */}
            <div className="relative">
              <input
                type={showRegPw2 ? "text" : "password"}
                placeholder="Еще раз пароль"
                value={regPw2}
                onChange={(e) => setRegPw2(e.target.value)}
                required
                className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white pl-4 pr-12 placeholder:text-[#1C1A61]/60 outline-none transition"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowRegPw2((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-[#1C1A61] hover:text-[#EC1822] transition"
                aria-label={showRegPw2 ? "Скрыть пароль" : "Показать пароль"}
              >
                {showRegPw2 ? (
                  <EyeOffIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                ) : (
                  <EyeIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmitRegister}
              className={[
                "w-full h-12 rounded-xl text-lg font-semibold transition-colors",
                canSubmitRegister
                  ? "bg-[#1C1A61] text-white hover:bg-[#EC1822]"
                  : "bg-[#1C1A61]/40 text-white/70 cursor-not-allowed",
              ].join(" ")}
            >
              Готово
            </button>
          </form>
        ) : (
          <form onSubmit={submitLogin} className="space-y-4">
            {/* только e-mail */}
            <EmailInput value={loginEmail} onChange={setLoginEmail} required />

            {/* пароль */}
            <div className="relative">
              <input
                type={showLoginPw ? "text" : "password"}
                placeholder="Пароль"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                required
                className="h-12 w-full rounded-xl border-2 border-[#1C1A61] bg-white pl-4 pr-12 placeholder:text-[#1C1A61]/60 outline-none focus:border-[#EC1822] transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowLoginPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center text-[#1C1A61] hover:text-[#EC1822] transition"
                aria-label={showLoginPw ? "Скрыть пароль" : "Показать пароль"}
              >
                {showLoginPw ? (
                  <EyeOffIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                ) : (
                  <EyeIcon className="w-5 h-5 [&_*]:stroke-current [&_*]:fill-none" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmitLogin}
              className={[
                "w-full h-12 rounded-xl text-lg font-semibold transition-colors",
                canSubmitLogin
                  ? "bg-[#1C1A61] text-white hover:bg-[#EC1822]"
                  : "bg-[#1C1A61]/40 text-white/70 cursor-not-allowed",
              ].join(" ")}
            >
              Войти
            </button>
          </form>
        )}

        {/* переключатель */}
        <div className="mt-6 text-center">
          {isLogin ? "Еще нет аккаунта? " : "Уже есть аккаунт? "}
          <button
            type="button"
            onClick={() => setIsLogin((v) => !v)}
            className="font-bold underline underline-offset-4 hover:text-[#EC1822] transition"
          >
            {isLogin ? "Регистрация" : "Авторизация"}
          </button>
        </div>
      </div>
    </div>
  );
}