import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";
import ProductCard from "../ProductCard/ProductCard";
import api from "../../lib/api";
import { toAbsMedia } from "../../config/api";

/* — утилиты — */
const STEP = 32;
const NOTCH_W = 360 + 24;

function fmtPhone(raw) {
  if (!raw) return "—";
  const d = String(raw).replace(/\D/g, "");
  const x = d.padStart(11, "7").slice(0, 11).split("");
  return `+${x[0]} (${x[1]}${x[2]}${x[3]}) ${x[4]}${x[5]}${x[6]}-${x[7]}${x[8]}-${x[9]}${x[10]}`;
}

function bearer() {
  const t =
    localStorage.getItem("access") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");
  return t ? `Bearer ${t}` : null;
}

async function tryGet(url) {
  const r = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(bearer() ? { Authorization: bearer() } : {}),
    },
    credentials: "include",
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/* — Эндпоинты под наш бек — */
const API_BASE = "/api";
const EP = {
  // /api/clients/me/ — наш актуальный профиль
  me: ["/clients/me/", "/customers/me/", "/users/me/", "/auth/user/"],
  // /favorites/ есть на бэке, ставим первым
  favorites: ["/favorites/", "/products/favorites/"],
  orders: ["/orders/", "/orders/history/"],
};

async function firstOk(paths) {
  for (const p of paths) {
    try {
      return await tryGet(API_BASE + p);
    } catch (_) {}
  }
  throw new Error("No endpoint worked");
}

export default function Profile() {
  const [me, setMe] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);

  const [activeTab, setActiveTab] = useState(null); // 'history' | 'favorites' | 'cert' | 'settings'
  const fileInputRef = useRef(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const haveToken = !!bearer();

        if (haveToken) {
          const [u, fav, ord] = await Promise.allSettled([
            firstOk(EP.me),
            api.getFavorites(),
            firstOk(EP.orders),
          ]);
          if (!alive) return;

          const demoMe = {
            first_name: "Вадим",
            last_name: "Ропотан",
            team: "Авангард Омск",
            phone: "7777777777",
            birth_date: "01.01.2025",
            bonuses: "10 990",
            avatar: "",
          };

          let normalizedMe = demoMe;

          if (u.status === "fulfilled" && u.value) {
            const raw = u.value;
            normalizedMe = {
              ...raw,
              // приводим поля бэка к тем, что ждёт вёрстка
              last_name: raw.last_name || raw.surname || demoMe.last_name,
              first_name: raw.first_name || raw.name || demoMe.first_name,
              team: raw.team || demoMe.team,
              phone: raw.phone || raw.phone_number || demoMe.phone,
              birth_date: raw.birth_date || raw.birthday || demoMe.birth_date,
              avatar: raw.avatar || raw.image || demoMe.avatar,
            };
          }

          setMe(normalizedMe);

          setFavorites(
            fav.status === "fulfilled"
              ? (fav.value || []).map(mapApiProduct)
              : DEMO_FAVORITES.map(mapDemoProduct)
          );
          setOrders(
            ord.status === "fulfilled"
              ? ord.value.results || ord.value
              : DEMO_ORDERS
          );
        } else {
          setMe({
            first_name: "Вадим",
            last_name: "Ропотан",
            team: "Авангард Омск",
            phone: "7777777777",
            birth_date: "01.01.2025",
            bonuses: "10 990",
            avatar: "",
          });
          setFavorites(DEMO_FAVORITES.map(mapDemoProduct));
          setOrders(DEMO_ORDERS);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const reloadFavorites = async () => {
      try {
        // ВАЖНО: берём избранное через api.getFavorites() (он ходит на /favorites/)
        const favs = await api.getFavorites();
        const arr = Array.isArray(favs?.results)
          ? favs.results
          : Array.isArray(favs)
          ? favs
          : [];
        if (!alive) return;
        setFavorites(arr.map(mapApiProduct));
      } catch (e) {
        if (!alive) return;
        setFavorites([]);
      }
    };

    // 1) загрузили один раз при входе в профиль
    reloadFavorites();

    // 2) и перезагружаем, когда где-то нажали сердце
    const onFavChanged = () => reloadFavorites();
    window.addEventListener("favorites:changed", onFavChanged);

    return () => {
      alive = false;
      window.removeEventListener("favorites:changed", onFavChanged);
    };
  }, []);

  const fullName = useMemo(() => {
    const last = me?.last_name || me?.surname || "";
    const first = me?.first_name || me?.name || "";
    return [last, first].filter(Boolean).join(" ");
  }, [me]);

  const phoneDisplay = useMemo(() => {
    const raw =
      me?.phone || me?.phone_number || me?.mobile || me?.profile?.phone || "";
    if (String(raw).trim().startsWith("+")) return String(raw);
    return fmtPhone(raw);
  }, [me]);

  const toggleTab = (key) =>
    setActiveTab((prev) => (prev === key ? null : key));

  const handleAvatarClick = () => {
    if (activeTab !== "settings") return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // локальный быстрый превью
    const previewUrl = URL.createObjectURL(file);
    setMe((prev) => (prev ? { ...prev, avatar: previewUrl } : prev));

    setAvatarUploading(true);
    setAvatarError(null);

    try {
      // загружаем файл на бэк через PATCH /clients/me/ с полем image
      const uploaded = await api.uploadAvatar(file); // теперь возвращает строку пути или null

      let uploadedPath = uploaded;
      if (uploaded && typeof uploaded === "object") {
        uploadedPath =
          uploaded.image ||
          uploaded.avatar ||
          uploaded.url ||
          Object.values(uploaded)[0];
      }
      if (!uploadedPath) throw new Error("upload returned empty path");

      // делаем абсолютный URL для <img src="...">
      const absolute = toAbsMedia(uploadedPath);

      // локально обновляем профиль изображением из ответа
      setMe((prev) =>
        prev ? { ...prev, avatar: absolute, image: uploadedPath } : prev
      );
    } catch (err) {
      console.error("avatar upload failed", err);
      setAvatarError("Не удалось загрузить фото");
    } finally {
      setAvatarUploading(false);
    }
  };

  const [edit, setEdit] = useState(null);
  useEffect(() => {
    if (activeTab === "settings" && me) {
      setEdit({
        last_name: me.last_name || "",
        first_name: me.first_name || "",
        team: me.team || "",
        phone: me.phone || "",
        birth_date: me.birth_date || "",
      });
    } else setEdit(null);
  }, [activeTab, me]);

  const saveSettings = async () => {
    if (!edit) return;
    // TODO: PATCH/PUT на бек /api/clients/me/
    setMe((m) => ({ ...m, ...edit }));
    setActiveTab(null);
  };

  const handleLogout = () => {
    // вычищаем токены и уводим на главную
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };

  return (
    <Container className="font-[Actay] text-[#1C1A61]">
      {/* Крошки — НЕ трогал */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span>Личный кабинет</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Личный кабинет
      </h1>

      {/* Верхняя фигура */}
      <section className="relative mb-12 isolate">
        <div className="grid grid-cols-1 md:grid-cols-[360px,1fr] md:grid-rows-[auto,auto] gap-x-6 gap-y-6 md:gap-y-0">
          {/* Фото */}
          <div className="md:col-start-1 md:row-start-1 relative z-10 mb-6 md:mb-0">
            <div className="bg-[#E5E5E5] rounded-[14px] p-5 shadow-sm">
              <div
                className="relative w-full aspect-square rounded-[14px] border border-[#1C1A61] bg-[#F3F3F3] overflow-hidden flex items-center justify-center"
                onClick={handleAvatarClick}
              >
                {me?.avatar || me?.image ? (
                  <img
                    src={me.avatar || me.image}
                    alt={fullName || "Аватар"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#1C1A61]/70 text-[18px] select-none">
                    Фото
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          {/* Инфо */}
          <div className="md:col-start-2 md:row-start-1 bg-[#E5E5E5] rounded-t-[14px] rounded-b-none p-6">
            {loading || !me ? (
              <div className="animate-pulse space-y-4">
                <div className="h-7 w-2/3 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/3 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/2 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/3 bg-[#1C1A61]/10 rounded" />
              </div>
            ) : (
              <>
                <h2 className="text-[28px] sm:text-[32px] font-extrabold mb-1">
                  {activeTab === "settings" ? (
                    <>
                      <InlineEdit
                        value={edit?.last_name ?? ""}
                        onChange={(v) =>
                          setEdit((s) => ({ ...s, last_name: v }))
                        }
                        className="mr-2"
                      />
                      <InlineEdit
                        value={edit?.first_name ?? ""}
                        onChange={(v) =>
                          setEdit((s) => ({ ...s, first_name: v }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      {me.last_name} {me.first_name}
                    </>
                  )}
                </h2>

                <p className="text-[18px] mb-6">
                  {activeTab === "settings" ? (
                    <InlineEdit
                      value={edit?.team ?? ""}
                      onChange={(v) => setEdit((s) => ({ ...s, team: v }))}
                      placeholder="Команда"
                    />
                  ) : (
                    me.team || "—"
                  )}
                </p>

                <div className="space-y-6">
                  <div>
                    <div className="text-[18px]">Номер телефона</div>
                    <div className="text-[26px] font-semibold">
                      {activeTab === "settings" ? (
                        <InlineEdit
                          value={edit?.phone ?? ""}
                          onChange={(v) => setEdit((s) => ({ ...s, phone: v }))}
                        />
                      ) : (
                        phoneDisplay || "—"
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[18px]">Дата рождения</div>
                    <div className="text-[26px] font-semibold">
                      {activeTab === "settings" ? (
                        <InlineEdit
                          value={edit?.birth_date ?? ""}
                          onChange={(v) =>
                            setEdit((s) => ({ ...s, birth_date: v }))
                          }
                          placeholder="ДД.ММ.ГГГГ"
                        />
                      ) : (
                        me.birth_date || me.birthday || "—"
                      )}
                    </div>
                  </div>

                  <div className="flex items-end gap-5">
                    <div>
                      <div className="text-[18px]">Сумма бонусов</div>
                      <div className="text-[46px] font-extrabold leading-none">
                        {me?.total_bonus ?? me?.bonuses ?? "0"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="self-center underline underline-offset-4 hover:text-[#EC1822] transition"
                    >
                      Подробнее…
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Нижний общий блок — список кнопок и контент ПРЯМО под каждой */}
          <div className="relative md:col-span-2 md:row-start-2 bg-[#E5E5E5] rounded-[14px] rounded-tr-none p-6">
            {/* вырез-ступенька слева */}
            <div
              className="hidden md:block absolute z-0 left-0 bg-white rounded-bl-[14px] pointer-events-none"
              style={{
                top: `-${STEP}px`,
                height: `${STEP}px`,
                width: `${NOTCH_W}px`,
              }}
            />

            <ul className="relative z-10 text-[20px] sm:text-[22px] font-extrabold">
              {/* — История покупок — */}
              <li className="py-2">
                <button
                  type="button"
                  onClick={() => toggleTab("history")}
                  className={`block text-left hover:text-[#EC1822] transition ${
                    activeTab === "history" ? "text-[#EC1822]" : ""
                  }`}
                >
                  История покупок
                </button>

                {activeTab === "history" && (
                  <div className="mt-4 space-y-4 text-[16px] font-normal">
                    {orders.map((o) => (
                      <div
                        key={o.id || o.number}
                        className="flex flex-col md:flex-row md:items-center justify_between gap-2 border border-[#1C1A61]/20 rounded-[12px] px-4 py-3 bg-[#F6F6F6]"
                      >
                        <div>
                          <div className="font-bold text-[18px]">
                            Чек № {o.number || o.id}
                          </div>
                          <div className="text-[14px] text-[#1C1A61]/70">
                            {o.date ? `от ${o.date}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[20px] font-extrabold">
                            {o.total || o.amount || ""}
                          </div>
                          <button
                            type="button"
                            className="rounded-[10px] px-4 py-2 bg-[#1C1A61] text-white text-[16px] hover:bg-[#EC1822] transition-colors"
                          >
                            Повторить заказ
                          </button>
                        </div>
                      </div>
                    ))}
                    {!orders?.length && (
                      <div className="text-[#1C1A61]/60">Пока пусто</div>
                    )}
                  </div>
                )}
              </li>

              {/* — Избранные товары — */}
              <li className="py-2">
                <button
                  type="button"
                  onClick={() => toggleTab("favorites")}
                  className={`block text-left hover:text-[#EC1822] transition ${
                    activeTab === "favorites" ? "text-[#EC1822]" : ""
                  }`}
                >
                  Избранные товары
                </button>

                {activeTab === "favorites" && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-[16px] font-normal">
                    {favorites.map((p) => (
                      <ProductCard key={p.slug || p.id} product={p} />
                    ))}
                    {!favorites?.length && (
                      <div className="text-[#1C1A61]/60">
                        Избранного пока нет
                      </div>
                    )}
                  </div>
                )}
              </li>

              {/* — Купить сертификат — */}
              <li className="py-2">
                <button
                  type="button"
                  onClick={() => toggleTab("cert")}
                  className={`block text-left hover:text-[#EC1822] transition ${
                    activeTab === "cert" ? "text-[#EC1822]" : ""
                  }`}
                >
                  Купить сертификат
                </button>

                {activeTab === "cert" && (
                  <div className="mt-4 text-[18px] font-normal max-w-xl">
                    Здесь позже будет форма покупки подарочного сертификата.
                  </div>
                )}
              </li>

              {/* — Настройки + ВЫЙТИ — */}
              <li className="py-2">
                <button
                  type="button"
                  onClick={() => toggleTab("settings")}
                  className={`block text-left hover:text-[#EC1822] transition ${
                    activeTab === "settings" ? "text-[#EC1822]" : ""
                  }`}
                >
                  Настройки
                </button>

                {activeTab === "settings" && (
                  <div className="mt-4 text-[16px] font-normal">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={saveSettings}
                        className="rounded-[10px] bg-[#1C1A61] text-white text-[16px] px-6 py-2 hover:bg-[#EC1822] transition-colors"
                      >
                        Сохранить изменения
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab(null)}
                        className="text-[#1C1A61]/70 hover:text-[#EC1822] underline underline-offset-4"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-[#EC1822] hover:text-[#b61018] underline underline-offset-4"
                      >
                        Выйти из аккаунта
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Container>
  );
}

/* — инлайн-редактор — */
function InlineEdit({ value, onChange, className = "", placeholder = "" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={[
        "bg-transparent outline-none",
        "border-b border-transparent focus:border-[#1C1A61]",
        "transition px-0",
        className,
      ].join(" ")}
    />
  );
}

/* — демо и мапперы — */
const DEMO_ORDERS = [];

const DEMO_FAVORITES = [];

function mapApiProduct(p) {
  return {
    id: p.id,
    slug: p.slug || p.slug_name || p.url_key || String(p.id),
    name: p.name || p.title,
    brand: p.brand_name || p.brand?.name,
    price: p.price || p.current_price || 0,
    image: p.image || p.images?.[0] || null,
    is_new: p.is_new ?? false,
    is_sale: p.is_sale ?? false,
  };
}

function mapDemoProduct(p) {
  return {
    id: p.id,
    name: p.name,
    brand: "",
    price: p.price,
    image: p.image,
    is_new: false,
    is_sale: false,
  };
}
