import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container";
import api from "../../lib/api";
import HeartIcon from "../../assets/icons/heart.svg?react";
import { useAuth } from "../../context/AuthContext";
import { toAbsMedia } from "../../config/api";

const STEP = 32;
const NOTCH_W = 360 + 24;

/** favorites persistence как в ProductCard */
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

function formatPrice(v) {
  if (v == null) return "—";
  const num = Number(v);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(num)
    .replace(/\u00A0/g, " ");
}

export default function BigProductPage() {
  const { slug } = useParams(); // путь вида /product/:slug
  const navigate = useNavigate();
  const { authed } = useAuth();

  // ====== states (ВАЖНО: объявлены ДО использования) ======
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // variants / sizes
  const [selectedVariantId, setSelectedVariantId] = useState(null);

  // qty for current selected variant (локальный, синхронизируем из корзины)
  const [qty, setQty] = useState(0);

  // cart busy
  const [cartBusy, setCartBusy] = useState(false);

  // favorite
  const [isFavorite, setIsFavorite] = useState(false);

  // ====== helpers ======
  const variants = useMemo(() => product?.variants || [], [product]);

  const sizes = useMemo(() => {
    // рисуем только варианты, у которых есть size_value
    return variants
      .filter((v) => (v?.size_value ?? "").trim().length > 0)
      .map((v) => ({
        id: v.id,
        label: v.size_value,
        isActive: !!v.is_active,
        price: v.current_price ?? v.price ?? null,
      }));
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!selectedVariantId) return null;
    return variants.find((v) => v?.id === selectedVariantId) || null;
  }, [variants, selectedVariantId]);

  // наличие: если есть размеры — по выбранному variant; если нет — fallback на product.in_stock
  const inStock = useMemo(() => {
    if (!product) return false;
    if (sizes.length) return !!selectedVariant?.is_active;
    return !!product.in_stock;
  }, [product, sizes.length, selectedVariant]);

  // цена: зависит от выбранного варианта
  const priceDisplay = useMemo(() => {
    if (!product) return "—";

    if (sizes.length && selectedVariant) {
      const vPrice =
        selectedVariant.current_price ??
        selectedVariant.price ??
        selectedVariant.min_price ??
        null;
      return formatPrice(vPrice);
    }

    return formatPrice(product.price);
  }, [product, sizes.length, selectedVariant]);

  const canAddToCart = useMemo(() => {
    if (!product) return false;
    if (cartBusy) return false;
    if (sizes.length) {
      if (!selectedVariant?.id) return false;
      if (!selectedVariant?.is_active) return false;
    }
    return true;
  }, [product, cartBusy, sizes.length, selectedVariant]);

  const ensureVariantId = () => {
    // у нас для корзины нужен variant.id
    return selectedVariant?.id ?? null;
  };

  // ====== sync qty from server cart (единый источник истины) ======
  const syncQtyFromCart = useCallback(async (variantId) => {
    if (!variantId) return;
    try {
      const cart = await api.getCart();
      const found = (cart?.items || []).find(
        (x) => Number(x.variant_id) === Number(variantId)
      );
      setQty(found ? Number(found.qty) : 0);
    } catch {
      // если корзина недоступна — не падаем
    }
  }, []);

  // ====== load product ======
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await api.getProduct(slug);
        if (!alive) return;

        const normalized = {
          id: data.id,
          slug: data.slug,
          name: data.name || data.title || "Товар",
          brand: data.brand_name || data.brand?.name || data.manufacturer || "",
          // арт НЕ показываем (оставляю в данных, но в UI не выводим)
          sku: data.article || data.sku || data.code || "",
          // fallback, если вообще нет variants
          in_stock:
            data.in_stock ??
            data.stock_available ??
            (typeof data.quantity === "number" ? data.quantity > 0 : true),
          // базовая цена, если variant не выбран
          price: data.min_price ?? data.price ?? data.current_price ?? 0,
          old_price: data.old_price || data.base_price || null,
          image: toAbsMedia(
            data.image || (data.images && data.images[0]) || ""
          ),
          description: data.description || data.full_description || "",
          variants: Array.isArray(data.variants) ? data.variants : [],
          is_favorited: !!data.is_favorited,
        };

        setProduct(normalized);

        // дефолтная выбранная вариация: первая active, иначе первая
        const vars = normalized.variants;
        const firstActive = vars.find((v) => !!v?.is_active);
        const nextVariantId = firstActive?.id ?? vars[0]?.id ?? null;
        setSelectedVariantId(nextVariantId);

        // favorite: localStorage OR api flag
        const favSet = getFavSet();
        setIsFavorite(favSet.has(normalized.slug) || normalized.is_favorited);

        // ВАЖНО: qty НЕ сбрасываем принудительно здесь.
        // qty синхронизируется отдельным эффектом по selectedVariantId.
      } catch (err) {
        console.error("load product error", err);
        if (!alive) return;
        setLoadError("Не удалось загрузить товар");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  // когда поменялся selectedVariantId — подтянуть qty из корзины
  useEffect(() => {
    if (!selectedVariantId) return;
    syncQtyFromCart(selectedVariantId);
  }, [selectedVariantId, syncQtyFromCart]);

  // когда корзина изменилась где-то ещё — обновить qty для текущего варианта
  useEffect(() => {
    const onChanged = () => {
      if (!selectedVariantId) return;
      syncQtyFromCart(selectedVariantId);
    };
    window.addEventListener("cart:changed", onChanged);
    return () => window.removeEventListener("cart:changed", onChanged);
  }, [selectedVariantId, syncQtyFromCart]);

  // ====== cart actions ======
  const onAddToCart = async () => {
    if (cartBusy) return;

    const vId = ensureVariantId();
    if (!vId) return;

    const safeQty = Math.max(1, Number(qty) || 1);

    setCartBusy(true);
    try {
      await api.setCartItem(vId, safeQty);
      // qty подтянется через cart:changed, но для мгновенного UI можно обновить сразу:
      setQty(safeQty);
    } finally {
      setCartBusy(false);
    }
  };

  const onDec = async () => {
    if (cartBusy) return;

    const vId = ensureVariantId();
    if (!vId) return;

    const next = qty - 1;

    setCartBusy(true);
    try {
      if (next <= 0) {
        await api.deleteCartItem(vId);
        setQty(0);
      } else {
        await api.setCartItem(vId, next);
        setQty(next);
      }
    } finally {
      setCartBusy(false);
    }
  };

  const onInc = async () => {
    if (cartBusy) return;

    const vId = ensureVariantId();
    if (!vId) return;

    const next = qty + 1;

    setCartBusy(true);
    try {
      await api.setCartItem(vId, next);
      setQty(next);
    } finally {
      setCartBusy(false);
    }
  };

  const onToggleFavorite = async () => {
    if (!product?.slug) return;

    if (!authed) {
      navigate("/register");
      return;
    }

    const slugKey = product.slug;
    const next = !isFavorite;
    setIsFavorite(next); // optimistic

    let ok = false;
    try {
      ok = next
        ? await api.addFavorite(slugKey)
        : await api.removeFavorite(slugKey);
    } catch (e) {
      ok = false;
    }

    if (!ok) {
      setIsFavorite(!next);
      return;
    }

    const set = getFavSet();
    if (next) set.add(slugKey);
    else set.delete(slugKey);
    saveFavSet(set);

    window.dispatchEvent(new Event("favorites:changed"));
  };

  return (
    <Container className="font-[Actay] text-[#1C1A61]">
      {/* Крошки — как на профиле */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <Link to="/" className="hover:text-[#EC1822] transition">
          Каталог
        </Link>
        <span className="px-2">›</span>
        <span>{product?.name || "Товар"}</span>
      </div>

      {/* Верхняя фигура — три блока как у профиля */}
      <section className="relative mb-12 isolate">
        <div className="grid grid-cols-1 md:grid-cols-[360px,1fr] md:grid-rows-[auto,auto] gap-x-6 gap-y-6 md:gap-y-0">
          {/* Фото */}
          <div className="md:col-start-1 md:row-start-1 relative z-10 mb-6 md:mb-0">
            <div className="bg-[#E5E5E5] rounded-[14px] p-5 pb-10 shadow-sm">
              <div className="relative w-full aspect-square rounded-[14px] border border-[#1C1A61] bg-[#F3F3F3] overflow-hidden flex items-center justify-center">
                {product?.image ? (
                  <img
                    src={product.image}
                    alt={product?.name || "Фото"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#1C1A61]/70 text-[18px] select-none">
                    Фото
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Инфо */}
          <div className="md:col-start-2 md:row-start-1 bg-[#E5E5E5] rounded-t-[14px] rounded-b-none p-6 pb-10">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-7 w-3/4 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/2 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/3 bg-[#1C1A61]/10 rounded" />
                <div className="h-10 w-1/2 bg-[#1C1A61]/10 rounded" />
              </div>
            ) : loadError ? (
              <div className="text-[#EC1822]">{loadError}</div>
            ) : (
              product && (
                <>
                  {/* Название + бренд */}
                  <div className="mb-4">
                    {/* ✅ 40px как ты просил */}
                    <div className="text-[40px] font-extrabold leading-tight">
                      {product.name}
                    </div>
                    {product.brand && (
                      <div className="text-[18px] mt-1">{product.brand}</div>
                    )}
                  </div>

                  {/* ✅ Арт. не показываем. Только наличие */}
                  <div className="flex flex-col gap-3 mb-4 text-[16px]">
                    <div>
                      <span className="inline-flex items-center px-4 py-2 border border-[#1C1A61] rounded-full text-[14px] font-medium">
                        {inStock ? "В наличии" : "Нет в наличии"}
                      </span>
                    </div>
                  </div>

                  {/* ✅ Размеры — как в фигме, значения из variants */}
                  {sizes.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[16px] mb-2">Выберите размер</div>

                      <div className="inline-flex rounded-[10px] overflow-hidden border border-[#1C1A61]">
                        {sizes.map((sz) => {
                          const isSelected = selectedVariantId === sz.id;
                          const disabled = !sz.isActive;

                          return (
                            <button
                              key={sz.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setSelectedVariantId(sz.id);
                                setQty(0);
                              }}
                              className={[
                                // ✅ размеры в один ряд, не друг под другом
                                "w-[70px] h-[44px] text-[24px] font-medium",
                                "border-r border-[#1C1A61]/60 last:border-r-0",
                                isSelected
                                  ? "bg-[#1C1A61] text-white"
                                  : "bg-white text-[#1C1A61]",
                                disabled
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:bg-[#1C1A61]/5",
                              ].join(" ")}
                            >
                              {sz.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Цена + кнопки */}
                  <div className="mt-4">
                    <div className="flex items-baseline gap-4 mb-4">
                      <div className="text-[42px] sm:text-[50px] font-extrabold leading-none">
                        {priceDisplay}
                      </div>
                      {product.old_price && (
                        <div className="text-[20px] text-[#1C1A61]/60 line-through">
                          {formatPrice(product.old_price)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      {/* ✅ В корзину -> - qty + как на мини-карте */}
                      {qty <= 0 ? (
                        <button
                          type="button"
                          disabled={!canAddToCart}
                          onClick={onAddToCart}
                          className={[
                            "rounded-[10px] px-6 py-2 text-[18px] font-semibold transition-colors",
                            canAddToCart
                              ? "bg-[#1C1A61] text-white hover:bg-[#EC1822]"
                              : "bg-[#1C1A61]/40 text-white/70 cursor-not-allowed",
                          ].join(" ")}
                        >
                          В корзину
                        </button>
                      ) : (
                        <div
                          className="rounded-[10px] px-4 py-2 bg-[#1C1A61] text-white flex items-center justify-between gap-4 text-[18px] font-semibold"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={cartBusy}
                            onClick={onDec}
                            className="w-8 h-8 rounded-md hover:bg-white/10"
                          >
                            –
                          </button>
                          <span className="min-w-6 text-center">{qty}</span>
                          <button
                            type="button"
                            disabled={cartBusy}
                            onClick={onInc}
                            className="w-8 h-8 rounded-md hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* ✅ Избранное — сердце */}
                      <button
                        type="button"
                        onClick={onToggleFavorite}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:border-[#EC1822] transition"
                        aria-label="Избранное"
                      >
                        <HeartIcon
                          className={[
                            "w-[26px] h-[22px]",
                            isFavorite
                              ? "text-[#EC1822] [&_*]:fill-current"
                              : "text-[#1C1A61] [&_*]:fill-transparent",
                            "[&_*]:stroke-current [&_*]:stroke-2",
                          ].join(" ")}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </div>

          {/* Нижний блок — описание, на всю ширину, с вырезом слева (как у профиля) */}
          <div className="relative md:col-span-2 md:row-start-2 mt bg-[#E5E5E5] rounded-[14px] rounded-tr-none px-6 pb-6 pt-10">
            {/* вырез-ступенька слева */}
            <div
              className="hidden md:block absolute z-0 left-0 bg-white rounded-bl-[14px] pointer-events-none"
              style={{
                top: `-${STEP}px`,
                height: `${STEP}px`,
                width: `${NOTCH_W}px`,
              }}
            />

            <div className="relative z-10">
              <h2 className="text-[24px] sm:text-[30px] font-extrabold mb-4">
                Описание
              </h2>

              {product?.description ? (
                <div className="text-[16px] leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <div className="text-[16px] text-[#1C1A61]/70">
                  Описание будет добавлено позже.
                </div>
              )}

              {/* История просмотра — пока заглушка (как ты просил) */}
              {/* <div className="mt-10 text-[20px] font-extrabold">История просмотров (в разработке)</div> */}
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
