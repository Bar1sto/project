import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeartIcon from "../../assets/icons/heart.svg?react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const FAV_LS_KEY = "fav_slugs";

function getFavSet() {
  try {
    const raw = localStorage.getItem(FAV_LS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFavSet(set) {
  localStorage.setItem(FAV_LS_KEY, JSON.stringify([...set]));
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { authed } = useAuth();

  const [isFavorite, setIsFavorite] = useState(!!product?.isFavorited);

  const slug = product?.slug || product?.product?.slug || null;

  const goToProduct = () => {
    if (!slug) return;
    navigate(`/product/${encodeURIComponent(slug)}`);
  };

  // ✅ qty теперь отображаем из корзины ПО SLUG (так не нужен variantId для отображения)
  const [qty, setQtyLocal] = useState(0);

  // variantId нужен только для действий (+/-/add)
  const [variantId, setVariantId] = useState(null);
  const [cartBusy, setCartBusy] = useState(false);

  const priceText =
    product?.price === null || product?.price === undefined
      ? "—"
      : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
          .format(Number(product.price))
          .replace(/\u00A0/g, " ");

  // если бэк иногда отдаёт дефолтный variant — используем, но НЕ обязателен для отображения qty
  const defaultVariantId = useMemo(() => {
    const v =
      product?.default_variant_id ??
      product?.variant_id ??
      product?.first_variant_id ??
      null;
    return v ? Number(v) : null;
  }, [product]);

  // ✅ синхронизируем qty по slug из корзины
  const syncQtyFromCartBySlug = useCallback(async () => {
    if (!slug) return;
    try {
      const cart = await api.getCart();
      const items = cart?.items || [];

      // суммируем qty всех позиций этого товара (на случай если в корзине 2 размера)
      let sum = 0;
      for (const it of items) {
        const itSlug = it?.product?.slug || it?.product_slug || null;
        if (itSlug && itSlug === slug) {
          sum += Number(it.qty) || 0;
        }
      }
      setQtyLocal(sum);
    } catch {
      // если не смогли загрузить — просто не падаем
    }
  }, [slug]);

  // получить variantId для изменений (default -> cache -> detail)
  const ensureVariantId = useCallback(async () => {
    if (defaultVariantId) return defaultVariantId;
    if (variantId) return variantId;
    if (!slug) return null;

    try {
      const detail = await api.getProduct(slug);
      const vars = Array.isArray(detail?.variants) ? detail.variants : [];
      const firstActive = vars.find((v) => !!v?.is_active) || vars[0];
      const id = firstActive?.id ? Number(firstActive.id) : null;
      setVariantId(id);
      return id;
    } catch {
      return null;
    }
  }, [defaultVariantId, variantId, slug]);

  // избранное
  useEffect(() => {
    if (!slug) return;

    const syncFromStorage = () => {
      const set = getFavSet();
      setIsFavorite(set.has(slug));
    };

    syncFromStorage();
    window.addEventListener("favorites:changed", syncFromStorage);
    return () =>
      window.removeEventListener("favorites:changed", syncFromStorage);
  }, [slug]);

  // ✅ при монтировании подтягиваем qty из корзины
  useEffect(() => {
    syncQtyFromCartBySlug();
  }, [syncQtyFromCartBySlug]);

  // ✅ при изменениях корзины обновляем qty
  useEffect(() => {
    const onChanged = () => syncQtyFromCartBySlug();
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, [syncQtyFromCartBySlug]);

  return (
    <article
      onClick={goToProduct}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && goToProduct()}
      className="
        font-[Actay]
        bg-[#E5E5E5] rounded-[10px] overflow-hidden
        w-[250px] h-[500px]
        flex flex-col
        transition-all duration-300
        cursor-pointer
      "
    >
      {/* фото-бокс */}
      <div
        className="
          mx-auto mt-[12px]
          w-[212px] h-[212px]
          rounded-[12px]
          border border-[#1C1A61]
          bg-[#ECECEC]
          flex items-center justify-center
        "
      >
        {product?.image ? (
          <img
            src={product.image}
            alt={product?.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1C1A61]/70">
            Фото
          </div>
        )}
      </div>

      {/* инфо-блок карточки */}
      <div className="flex-1 flex flex-col px-[16px] text-[#1C1A61]">
        <div className="flex flex-wrap items-center gap-2 mt-[15px] mb-[6px]">
          {product?.isHit ? (
            <span className="inline-flex h-[20px] rounded-full bg-[#EC1822] text-white text-[12px] leading-[16px] px-[8px] py-[2px]">
              ХИТ
            </span>
          ) : null}

          {product?.isNew ? (
            <span className="inline-flex h-[20px] rounded-full bg-[#EC1822] text-white text-[12px] leading-[16px] px-[8px] py-[2px]">
              NEW
            </span>
          ) : null}

          {product?.isSale ? (
            <span className="inline-flex h-[20px] rounded-full bg-[#EC1822] text-white text-[12px] leading-[16px] px-[8px] py-[2px]">
              SALE
            </span>
          ) : null}
        </div>

        {/* НАЗВАНИЕ — внутри <h3> и с clamp на 2 строки */}
        <h3
          className="
      text-[20px] font-medium mb-[8px]
      transition-colors duration-300
      group-hover:text-[#EC1822]
      overflow-hidden text-ellipsis
      [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]
    "
        >
          {product?.name || "Без названия"}
        </h3>

        {/* ВАЖНО: этот контейнер прижимает НИЗ карточки */}
        <div className="mt-auto pt-[8px] pb-[16px]">
          {/* цена */}
          <p className="text-[36px] font-bold mb-[1px] px-[8px] whitespace-nowrap ">
            {priceText}
          </p>

          {/* кнопки */}
          <div className="flex justify-center gap-[8px] px-[8px]">
            {/* В КОРЗИНУ — как было в CSS */}
            {qty <= 0 ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (cartBusy) return;

                  const vId = await ensureVariantId();
                  if (!vId) return;

                  setCartBusy(true);
                  try {
                    await api.setCartItem(vId, 1);
                    // обновим qty через корзину (истина = сервер)
                    window.dispatchEvent(new CustomEvent("cart:changed"));
                  } finally {
                    setCartBusy(false);
                  }
                }}
                className="flex-1 bg-[#1C1A61] text-white px-[12px] py-[8px] rounded-[10px] text-[24px] transition-colors duration-300 hover:bg-[#EC1822]"
              >
                В корзину
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-[#1C1A61] text-white px-[12px] py-[8px] rounded-[10px] flex items-center justify-between text-[20px]"
              >
                <button
                  type="button"
                  disabled={cartBusy}
                  onClick={async () => {
                    if (cartBusy) return;

                    const vId = await ensureVariantId();
                    if (!vId) return;

                    const next = qty - 1;

                    setCartBusy(true);
                    try {
                      if (next <= 0) {
                        await api.deleteCartItem(vId);
                      } else {
                        await api.setCartItem(vId, next);
                      }
                      window.dispatchEvent(new CustomEvent("cart:changed"));
                    } finally {
                      setCartBusy(false);
                    }
                  }}
                  className="w-8 h-8 rounded-md hover:bg-white/10"
                >
                  –
                </button>
                <span className="min-w-6 text-center font-semibold">{qty}</span>
                <button
                  type="button"
                  disabled={cartBusy}
                  onClick={async () => {
                    if (cartBusy) return;

                    const vId = await ensureVariantId();
                    if (!vId) return;

                    const next = qty + 1;

                    setCartBusy(true);
                    try {
                      await api.setCartItem(vId, next);
                      window.dispatchEvent(new CustomEvent("cart:changed"));
                    } finally {
                      setCartBusy(false);
                    }
                  }}
                  className="w-8 h-8 rounded-md hover:bg-white/10"
                >
                  +
                </button>
              </div>
            )}

            {/* ИЗБРАННОЕ — контур по умолчанию, заливка при клике */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();

                if (!authed) {
                  navigate("/register");
                  return;
                }
                if (!slug) return;

                const next = !isFavorite;
                setIsFavorite(next); // optimistic

                let ok = false;
                try {
                  ok = next
                    ? await api.addFavorite(slug)
                    : await api.removeFavorite(slug);
                } catch {
                  ok = false;
                }

                if (!ok) {
                  setIsFavorite(!next);
                  return;
                }

                const set = getFavSet();
                if (next) set.add(slug);
                else set.delete(slug);
                saveFavSet(set);

                window.dispatchEvent(new Event("favorites:changed"));
              }}
              className="
    group
    w-[40px] h-[40px] mt-[5px]
    rounded-[4px] bg-[#E5E5E5]
    flex items-center justify-center
    transition
  "
              aria-label="Избранное"
            >
              <HeartIcon
                className={[
                  "w-[30px] h-[26px]",
                  isFavorite
                    ? "text-[#EC1822] [&_*]:fill-current"
                    : "text-[#1C1A61] [&_*]:fill-transparent",
                  "[&_*]:stroke-current [&_*]:stroke-2",
                  !isFavorite ? "group-hover:text-[#EC1822]" : "",
                ].join(" ")}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
