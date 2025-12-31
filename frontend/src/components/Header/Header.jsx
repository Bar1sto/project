import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import SearchIcon from "../../assets/icons/search.svg?react";
import UserIcon from "../../assets/icons/profile.svg?react";
import FavoriteIcon from "../../assets/icons/favorite.svg?react";
import CartIcon from "../../assets/icons/cart.svg?react";
import api from "../../lib/api";

const CATALOG = [
  {
    title: "Игрок",
    items: [
      { label: "Клюшки", value: "Клюшка" },
      { label: "Коньки", value: "Коньки" },
      { label: "Шлема", value: "Шлем" },
      { label: "Текстиль", value: "Текстиль" },
      { label: "Сумки", value: "Сумки" },
      { label: "Щитки", value: "Щитки" },
      { label: "Трусы", value: "Трусы" },
      { label: "Перчатки", value: "Перчатки" },
      { label: "Налокотники", value: "Налокотники" },
      { label: "Нагрудники", value: "Нагрудник" },
      { label: "Набор экипировки", value: "Набор экипировки" },
    ],
  },
  {
    title: "Вратарь",
    items: [
      { label: "Клюшки", value: "Клюшка вратаря" }, // имя из админки
      { label: "Коньки", value: "Коньки вратаря" },
      { label: "Шлема", value: "Шлем вратаря" },
      { label: "Текстиль", value: "Текстиль вратаря" },
      { label: "Сумки", value: "Сумки вратаря" },
      { label: "Блокер", value: "Блокер" },
      { label: "Блокер+ловушка", value: "Блокер+ловушка" },
      { label: "Ловушка", value: "Ловушка" },
      { label: "Нагрудник", value: "Нагрудник вратаря" },
      { label: "Трусы", value: "Трусы вратаря" },
      { label: "Щитки", value: "Щитки вратаря" },
    ],
  },
  {
    title: "Фигурное катание",
    items: [
      { label: "Коньки", value: "Коньки фигурные" },
      { label: "Одежда", value: "Одежда для фигурного катания" },
    ],
  },
  {
    title: "Флорбол",
    items: [
      { label: "Клюшки", value: "Клюшка флорбол" },
      { label: "Аксессуары", value: "Аксессуары флорбол" },
    ],
  },
  {
    title: "Тренировка",
    items: [
      { label: "Ворота", value: "Ворота" },
      { label: "Мячи", value: "Мячи" },
      { label: "Искусственный лед", value: "Искусственный лед" },
      { label: "Тренировочный инвентарь", value: "Тренировочный инвентарь" },
    ],
  },
  {
    title: "Аксессуары",
    items: [
      { label: "Бутылки", value: "Бутылки" },
      { label: "Доски тактические", value: "Доски тактические" },
      { label: "Коврики", value: "Коврики" },
      { label: "Медицинские средства", value: "Медицинские средства" },
      { label: "Мячи", value: "Мячи аксессуары" },
      { label: "Наклейки", value: "Наклейки" },
      { label: "Шайбы", value: "Шайбы" },
      { label: "Сувениры", value: "Сувениры" },
    ],
  },
];

const isNode = (x) =>
  x && typeof x === "object" && !Array.isArray(x) && "items" in x;

export default function Header() {
  const [cartTotal, setCartTotal] = useState(0);

  const formatRub = (n) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
      .format(Number(n) || 0)
      .replace(/\u00A0/g, " ");

  const loadCartTotal = useCallback(async () => {
    try {
      const cart = await api.getCart();
      const t = Number.parseFloat(cart?.total);
      setCartTotal(Number.isFinite(t) ? t : 0);
    } catch {
      setCartTotal(0);
    }
  }, []);

  useEffect(() => {
    loadCartTotal();
    const onChanged = () => loadCartTotal();
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, [loadCartTotal]);

  const location = useLocation();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (api.hasToken()) navigate("/profile");
    else navigate("/register");
  };

  // поиск
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

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

  // вычисляем высоту шапки для позиционирования мегаменю
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

  const normalizeStr = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const extractList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.items)) return data.items;
    return [];
  };

  const rankAndCut = (list, query, limit = 5) => {
    const nq = normalizeStr(query);
    if (!nq) return [];

    const ranked = list
      .map((p) => {
        const name = normalizeStr(p?.name);
        const slug = normalizeStr(p?.slug);
        let score = 999;

        if (name === nq) score = 0;
        else if (name.startsWith(nq)) score = 1;
        else if (name.includes(nq)) score = 2;
        else if (slug.includes(nq)) score = 3;

        return { p, score, nameLen: name.length };
      })
      .filter((x) => x.score < 999)
      .sort((a, b) => a.score - b.score || a.nameLen - b.nameLen);

    const exact = ranked.find((x) => x.score === 0);
    if (exact) return [exact.p];

    return ranked.slice(0, limit).map((x) => x.p);
  };

  const fetchSuggestions = useCallback(async (query) => {
    const qq = String(query || "").trim();
    if (qq.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setNoResults(false);
      return;
    }

    setSearching(true);
    setNoResults(false);

    try {
      // 1) server-side search
      let res = await fetch(
        `/api/products/?search=${encodeURIComponent(qq)}&limit=50`,
        { headers: { Accept: "application/json" } }
      );
      let data = await res.json().catch(() => ({}));
      let list = extractList(data);

      // 2) fallback q=
      if (!list.length) {
        res = await fetch(
          `/api/products/?q=${encodeURIComponent(qq)}&limit=50`,
          {
            headers: { Accept: "application/json" },
          }
        );
        data = await res.json().catch(() => ({}));
        list = extractList(data);
      }

      // 3) если бэк не фильтрует — берём побольше и фильтруем на фронте
      if (!list.length) {
        res = await fetch(`/api/products/?limit=200`, {
          headers: { Accept: "application/json" },
        });
        data = await res.json().catch(() => ({}));
        list = extractList(data);
      }

      const cut = rankAndCut(list, qq, 5);
      setSuggestions(cut);
      setNoResults(cut.length === 0);
    } catch (e) {
      console.error("search error", e);
      setSuggestions([]);
      setNoResults(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const qq = String(q || "").trim();
    if (!qq) return;

    // если есть подсказки — открываем первую (как “точное совпадение” / лучший матч)
    if (suggestions && suggestions.length) {
      const s = suggestions[0];
      if (s?.slug) {
        setIsSearchOpen(false);
        setSuggestions([]);
        setNoResults(false);
        navigate(`/product/${s.slug}`);
        return;
      }
    }

    // иначе ведём в каталог с поиском (если у каталога есть фильтр по search)
    setIsSearchOpen(false);
    setSuggestions([]);
    setNoResults(false);
    navigate(`/catalog?search=${encodeURIComponent(qq)}`);
  };

  useEffect(() => {
    if (!isSearchOpen) return;

    const qq = String(q || "").trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (qq.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setNoResults(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(qq);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, isSearchOpen, fetchSuggestions]);

  useEffect(() => {
    const onDown = (e) => {
      if (!isSearchOpen) return;
      const box = searchBoxRef.current;
      if (!box) return;
      if (box.contains(e.target)) return;

      setIsSearchOpen(false);
      setSuggestions([]);
      setNoResults(false);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isSearchOpen]);

  return (
    <header
      ref={headerRef}
      className="bg-[#E5E5E5] font-[Actay] sticky top-0 z-50"
    >
      {/* верхняя полоса */}
      <div className="mx-auto w-full max-w-screen-2xl px-4 lg:px-6 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* бургер */}
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

        {/* логотип */}
        <div className="justify-self-start">
          <img
            src={logo}
            alt="Хоккейный магазин"
            className="h-[clamp(40px,5vw,52px)] w-auto"
          />
        </div>

        {/* навигация */}
        <nav className="hidden xl:flex items-center gap-[clamp(20px,3vw,56px)] justify-self-center">
          <div
            className="relative"
            onMouseEnter={openMenu}
            onMouseLeave={scheduleClose}
          >
            <button
              className="font text-[clamp(16px,1.6vw,22px)] text-[#1C1A61] hover:text-[#EC1822] py-1"
              onClick={() => navigate("/catalog")}
            >
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
            <SearchIcon
              className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2"
            />
          </button>

          <button
            type="button"
            onClick={handleProfileClick}
            className="group p-2 hover:scale-110 transition"
            aria-label="Профиль"
          >
            <UserIcon
              className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2"
            />
          </button>

          <Link
            to="/favorites"
            className="group p-2 hover:scale-110 transition"
            aria-label="Избранное"
          >
            <FavoriteIcon
              className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822] 
            transition-colors
            fill-[none]
            [&_*]:stroke-current 
            [&_*]:stroke-2"
            />
          </Link>

          <Link
            to="/cart"
            className="group p-2 hover:scale-110 transition"
            aria-label="Корзина"
          >
            <CartIcon
              className="
            w-[clamp(20px,2vw,24px)] h-[clamp(20px,2vw,24px)]
            text-[#1C1A61] 
            group-hover:text-[#EC1822]
            transition-colors
            fill-[none]
            [&_*]:stroke-current
            [&_*]:stroke-2"
            />
            {cartTotal > 0 && (
              <span
                className="ml-2 hidden md:inline-flex items-center h-6 px-3 rounded-full bg-[#1C1A61] text-white text-[13px] font-semibold leading-none"
                title="Сумма корзины"
              >
                {formatRub(cartTotal)} ₽
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* полоса поиска */}
      {isSearchOpen && (
        <div
          ref={searchBoxRef}
          className="bg-[#E5E5E5] border-t border-[#1C1A61]/10"
        >
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
          {/* подсказки поиска */}
          {String(q || "").trim().length >= 2 && (
            <div className="mx-auto w-full max-w-screen-2xl px-4 lg:px-6 pb-3 text-[#1C1A61]">
              {searching && (
                <div className="text-[14px] text-[#1C1A61]/70 px-2 py-2">
                  Поиск…
                </div>
              )}

              {!searching && suggestions && suggestions.length > 0 && (
                <div className="space-y-3">
                  {suggestions.slice(0, 5).map((p) => {
                    const img =
                      p?.image ||
                      p?.image_url ||
                      p?.main_image ||
                      p?.thumbnail ||
                      p?.images?.[0]?.image ||
                      p?.images?.[0]?.url ||
                      null;

                    const price =
                      p?.price ??
                      p?.current_price ??
                      p?.min_price ??
                      p?.minPrice ??
                      null;

                    return (
                      <button
                        key={p?.id || p?.slug || p?.name}
                        type="button"
                        onClick={() => {
                          if (!p?.slug) return;
                          setIsSearchOpen(false);
                          setSuggestions([]);
                          setNoResults(false);
                          navigate(`/product/${p.slug}`);
                        }}
                        className="w-full border border-[#1C1A61]/20 rounded-[12px] p-3 sm:p-4 flex gap-3 sm:gap-4 items-center bg-[#F3F3F3] hover:bg-white/60 transition text-left"
                      >
                        <div className="w-[70px] h-[70px] rounded-[10px] border border-[#1C1A61]/40 bg:white flex items-center justify-center overflow-hidden shrink-0 bg-white">
                          {img ? (
                            <img
                              src={img}
                              alt={p?.name || "Товар"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[#1C1A61]/50 text-[12px]">
                              Фото
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[16px] sm:text-[18px] font-semibold truncate">
                            {p?.name || "Товар"}
                          </div>

                          {/* как в Checkout — вторую строку делаем "Размер: —" чтобы стиль совпадал */}
                          <div className="text-[14px] text-[#1C1A61]/70 mt-1">
                            Размер: —
                          </div>

                          {/* как в Checkout — третья строка (количество) */}
                          <div className="text-[14px] text-[#1C1A61]/70">
                            Количество: 1 шт.
                          </div>
                        </div>

                        {price !== null && price !== undefined && (
                          <div className="text-right shrink-0">
                            <div className="text-[18px] sm:text-[20px] font-extrabold">
                              {formatRub(price)} ₽
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {!searching && noResults && (
                <div className="text-[14px] text-[#1C1A61]/70 px-2 py-2">
                  Такого товара похоже нет :(
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DESKTOP MEGA-MENU */}
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
                  {col.items.map((item, i) => {
                    const label = typeof item === "string" ? item : item.label;
                    const value = typeof item === "string" ? item : item.value;

                    return (
                      <li key={i}>
                        <Link
                          to={`/catalog?group=${encodeURIComponent(
                            col.title
                          )}&category=${encodeURIComponent(value)}`}
                          className="block text-[#1C1A61] font-medium text-[clamp(15px,1.2vw,20px)]
                                   hover:text-[#EC1822] transition-colors"
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto w-full max-w-[1600px] px-6 pb-6">
            <div className="rounded-b-3xl bg-[#E5E5E5]" />
          </div>
        </div>
      </div>

      {/* МОБИЛЬНЫЙ КАТАЛОГ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40" onClick={resetMobile} />
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
                const label = leaf
                  ? typeof it === "string"
                    ? it
                    : it.label
                  : it.title;
                const value = leaf
                  ? typeof it === "string"
                    ? it
                    : it.value
                  : null;

                return (
                  <div key={i} className="border-b">
                    {leaf ? (
                      <Link
                        to={
                          currentNode.title === "Каталог"
                            ? "/catalog"
                            : `/catalog?group=${encodeURIComponent(
                                currentNode.title
                              )}&category=${encodeURIComponent(value)}`
                        }
                        onClick={resetMobile}
                        className="flex items-center justify-between px-3 py-4 text-[17px] text-[#1C1A61] hover:text-[#EC1822] transition-colors"
                      >
                        <span>{label}</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => enter(it)}
                        className="w-full flex items-center justify-between px-3 py-4 text-[17px] text-[#1C1A61] hover:text-[#EC1822] transition-colors"
                      >
                        <span className="text-left">{label}</span>
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
