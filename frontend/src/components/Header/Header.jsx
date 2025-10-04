// src/components/Header/Header.jsx
import { Profiler, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import logo from "../../assets/logo.png";
import SearchIcon from "../../assets/search.svg?react";
import UserIcon from "../../assets/profile.svg?react";
import FavoriteIcon from "../../assets/favorite.svg?react";
import CartIcon from "../../assets/cart.svg?react";

// порядок колонок как в твоём макете: Игрок, Вратарь, Фигурное, Флорбол, Тренировка, Аксессуары
const CATALOG = [
  {
    title: "Игрок",
    items: [
      "Клюшки",
      "Коньки",
      "Шлема",
      "Текстиль",
      "Сумки",
      "Щитки",
      "Трусы",
      "Перчатки",
      "Налокотники",
      "Нагрудники",
      "Набор экипировки",
    ],
  },
  {
    title: "Вратарь",
    items: [
      "Клюшки",
      "Коньки",
      "Шлема",
      "Текстиль",
      "Сумки",
      "Блокер",
      "Блокер+ловушка",
      "Ловушка",
      "Нагрудник",
      "Трусы",
      "Щитки",
    ],
  },
  { title: "Фигурное катание", items: ["Коньки", "Одежда"] },
  { title: "Флорбол", items: ["Клюшки", "Аксессуары"] },
  {
    title: "Тренировка",
    items: ["Ворота", "Мячи", "Искусственный лед", "Тренировочный инвентарь"],
  },
  {
    title: "Аксессуары",
    items: [
      "Бутылки",
      "Доски тактические",
      "Коврики",
      "Медицинские средства",
      "Мячи",
      "Наклейки",
      "Шайбы",
      "Сувениры",
    ],
  },
];

const isNode = (x) =>
  x && typeof x === "object" && !Array.isArray(x) && "items" in x;

export default function Header() {
  const location = useLocation();

  // поиск
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  // состояние каталога
  const [catalogOpen, setCatalogOpen] = useState(false);
  const closeTimer = useRef(null);
  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setCatalogOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCatalogOpen(false), 180);
  };

  // мобильная панель каталога
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stack, setStack] = useState([]);
  const currentNode = useMemo(
    () =>
      stack.length
        ? stack[stack.length - 1]
        : { title: "Каталог", items: CATALOG },
    [stack]
  );
  const crumbs = useMemo(
    () => ["Каталог", ...stack.map((n) => n.title)],
    [stack]
  );
  const enter = (node) => setStack((s) => [...s, node]);
  const back = () => setStack((s) => s.slice(0, -1));
  const resetMobile = () => {
    setMobileOpen(false);
    setStack([]);
  };

  // вычисляем высоту шапки, чтобы приклеить мегаменю фиксировано к низу хедера
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(72);
  useEffect(() => {
    const calc = () => {
      if (!headerRef.current) return;
      setHeaderH(Math.ceil(headerRef.current.getBoundingClientRect().height));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    // подключим поиск позже
  };

  return (
    <header
      ref={headerRef}
      className="bg-[#E5E5E5] font-[Actay] sticky top-0 z-50"
    >
      {/* Верхняя полоса — сетка из трёх колонок, чтобы меню было строго по центру */}
      <div className="mx-auto w-full max-w-screen-2xl px-4 lg:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* бургер — показываем до XL (раньше уходим в мобильный, как просил) */}
        <button
          onClick={() => setMobileOpen(true)}
          className="xl:hidden inline-flex items-center justify-center rounded-lg border border-[#1C1A61]/20 w-10 h-10"
          aria-label="Открыть каталог"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="#1C1A61"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* логотип слева */}
        <div className="justify-self-start">
          <img
            src={logo}
            alt="Хоккейный магазин"
            className="h-[clamp(40px,5vw,52px)] w-auto"
          />
        </div>

        {/* навигация строго по центру (появляется с XL) */}
        <nav className="hidden xl:flex items-center gap-[clamp(20px,3vw,56px)] justify-self-center">
          <div
            className="relative"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <button className="font text-[clamp(16px,1.6vw,22px)] text-[#1C1A61] hover:text-[#EC1822] py-1">
              Каталог
            </button>
          </div>

          <Link
            to="/attributes"
            className="font text-[clamp(16px,1.6vw,22px)] text-[#1C1A61] hover:text-[#EC1822]"
          >
            Атрибутика
          </Link>
          <Link
            to="/contacts"
            className="font text-[clamp(16px,1.6vw,22px)] text-[#1C1A61] hover:text-[#EC1822]"
          >
            Контакты
          </Link>
        </nav>

        {/* иконки справа */}
        <div className="flex items-center gap-4 ml-auto">
          {/* поиск */}
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            className="group p-2 hover:scale-110 transition"
            aria-label="Поиск"
          >
            <SearchIcon className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2" />
          </button>

          <Link
            to="/register"
            className="group p-2 hover:scale-110 transition"
            aria-label="Профиль"
          >
           <UserIcon className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2" />
          </Link>

          <Link
            to="/favorites"
            className="group p-2 hover:scale-110 transition"
            aria-label="Избранное"
          >
           <FavoriteIcon className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2" />
          </Link>

          <Link
            to="/cart"
            сlassName="group p-2 hover:scale-110 transition" 
            aria-label="Корзина">
            <CartIcon className="
           w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2" />
          </Link>
        </div>
      </div>

      {/* полоса поиска под шапкой */}
      {isSearchOpen && (
        <div className="bg-[#E5E5E5] border-t border-[#1C1A61]/10">
          <form
            onSubmit={onSubmitSearch}
            className="mx-auto w-full max-w-screen-2xl px-4 lg:px-6 py-3 flex items-center gap-3"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск товаров…"
              className="flex-1 rounded-full border-2 border-[#1C1A61] px-5 py-2 outline-none focus:border-[#EC1822] transition"
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-black/5 transition flex items-center justify-center text-[#1C1A61] text-xl"
              aria-label="Закрыть поиск"
            >
              ×
            </button>
          </form>
        </div>
      )}

      {/* ===== DESKTOP MEGA-MENU — ВО ВСЮ ШИРИНУ ЭКРАНА ===== */}
      {/* делаем fixed + inset-x-0 и задаём top равным высоте хедера */}
      <div
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        className={`hidden xl:block fixed left-0 right-0 ${
          catalogOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        } transition-opacity duration-150 z-[60]`}
        style={{ top: `${Math.max(0, headerH - 1)}px` }}
      >
        <div className="bg-[#E5E5E5] border-t border-[#1C1A61]/10 shadow-xl rounded-b-3xl">
          <div
            className="mx-auto w-full max-w-[1600px] px-6 py-8
                          grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6
                          gap-x-14 gap-y-8"
          >
            {CATALOG.map((col, idx) => (
              <div key={idx} className="min-w-0">
                <h3
                  className="text-[#1C1A61] font-extrabold leading-tight
                               text-[clamp(22px,2vw,34px)] mb-3"
                >
                  {col.title}
                </h3>
                <ul className="space-y-2">
                  {col.items.map((item, i) => (
                    <li key={i}>
                      <Link
                        to="/"
                        className="block text-[#1C1A61] font-medium text-[clamp(15px,1.2vw,20px)]
                                   hover:text-[#EC1822] transition-colors"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* «подложка» с большим радиусом снизу — как в макете */}
          <div className="mx-auto w-full max-w-[1600px] px-6 pb-6">
            <div className="rounded-b-3xl bg-[#E5E5E5]" />
          </div>
        </div>
      </div>

      {/* ===== МОБИЛЬНЫЙ КАТАЛОГ (Xl-) ===== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70]">
          {/* фон */}
          <div className="absolute inset-0 bg-black/40" onClick={resetMobile} />
          {/* панель */}
          <div className="absolute inset-y-0 left-0 w-full sm:max-w-md bg-white flex flex-col">
            <div className="px-4 py-3 flex items-center gap-3 border-b">
              <button
                onClick={stack.length ? back : resetMobile}
                className="w-10 h-10 rounded-lg border border-black/10 flex items-center justify-center"
                aria-label={stack.length ? "Назад" : "Закрыть"}
              >
                {stack.length ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 6l-6 6 6 6"
                      stroke="#111"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="#111"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {/* крошки — синий текст и красный hover на кликабельных */}
                <div className="text-sm text-[#1C1A61] truncate">
                  {crumbs.map((c, i) => (
                    <span key={i} className="hover:text-[#EC1822]">
                      {i ? " / " + c : c}
                    </span>
                  ))}
                </div>
                <div className="font-bold text-lg text-[#1C1A61] truncate">
                  {currentNode.title}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {currentNode.items.map((it, i) => {
                const leaf = !isNode(it);
                const title = leaf ? it : it.title;
                return (
                  <div key={i} className="border-b">
                    {leaf ? (
                      <Link
                        to="/"
                        onClick={resetMobile}
                        className="flex items-center justify-between px-3 py-4 text-[17px] text-[#1C1A61] hover:text-[#EC1822] transition-colors"
                      >
                        <span>{title}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => enter(it)}
                        className="w-full flex items-center justify-between px-3 py-4 text-[17px] text-[#1C1A61] hover:text-[#EC1822] transition-colors"
                      >
                        <span className="text-left">{title}</span>
                        <svg
                          className="w-5 h-5 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="#111"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
