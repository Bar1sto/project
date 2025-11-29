// src/pages/BigProductPage/BigProductPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container";
import api from "../../lib/api";
import { toAbsMedia } from "../../config/api";

const STEP = 32;
const NOTCH_W = 360 + 24;

function formatPrice(v) {
  if (v == null) return "—";
  const num = Number(v);
  if (Number.isNaN(num)) return String(v);
  return num.toLocaleString("ru-RU") + " ₽";
}

export default function BigProductPage() {
  const { slug } = useParams(); // путь вида /product/:slug
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        if (!slug) {
          throw new Error("no_slug");
        }

        const data = await api.getProduct(slug);

        if (!alive) return;

        const normalized = {
          id: data.id,
          slug: data.slug || slug,
          name: data.name || data.title || "Товар",
          brand: data.brand_name || data.brand?.name || data.manufacturer || "",
          sku: data.article || data.sku || data.code || "",
          in_stock:
            data.in_stock ?? data.stock_available ?? data.quantity > 0 ?? true,
          price: data.price || data.current_price || 0,
          old_price: data.old_price || data.base_price || null,
          image: toAbsMedia(
            data.image || (data.images && data.images[0]) || ""
          ),
          description: data.description || data.full_description || "",
          sizes: data.sizes || data.size_options || data.variations || [], // по бэку можно уточнить
        };

        setProduct(normalized);
        setIsFavorite(!!data.is_favorited);

        // сообщаем бэку, что товар просмотрен (redis/БД — на его стороне)
        // if (normalized.id) {
        //   api.markProductViewed(normalized.id).catch(() => {});
        // }
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

  const priceDisplay = useMemo(
    () => (product ? formatPrice(product.price) : "—"),
    [product]
  );

  const sizes = useMemo(() => {
    if (!product?.sizes || !product.sizes.length) {
      // демо-набор на случай отсутствия размеров
      return [];
    }
    return product.sizes;
  }, [product]);

  const onAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await api.addToCart(product.id, {
        quantity: 1,
        size: selectedSize,
      });
      // можно всплывающее уведомление или переход в корзину
      // navigate("/cart");
    } catch (e) {
      console.error("addToCart error", e);
    } finally {
      setAddingToCart(false);
    }
  };

  const onToggleFavorite = async () => {
    if (!product) return;
    try {
      const fav = await api.toggleFavorite(product.id);
      setIsFavorite(fav);
    } catch (e) {
      console.error("toggleFavorite error", e);
    }
  };

  const canAddToCart =
    !!product && (!sizes.length || !!selectedSize) && !addingToCart;

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

      {/* Заголовок */}
      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6 leading-tight">
        {product?.name || (loading ? "Загрузка…" : "Товар")}
      </h1>

      {/* Верхняя фигура — три блока как у профиля */}
      <section className="relative mb-12 isolate">
        <div className="grid grid-cols-1 md:grid-cols-[360px,1fr] md:grid-rows-[auto,auto] gap-x-6 gap-y-6 md:gap-y-0">
          {/* Фото */}
          <div className="md:col-start-1 md:row-start-1 relative z-10 mb-6 md:mb-0">
            <div className="bg-[#E5E5E5] rounded-[14px] p-5 shadow-sm">
              <div className="relative w-full aspect-square rounded-[14px] border border-[#1C1A61] bg-[#F3F3F3] overflow-hidden flex items-center justify-center">
                {product?.image && !loading ? (
                  <img
                    src={product.image}
                    alt={product.name}
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

          <div className="md:col-start-2 md:row-start-1 bg-[#E5E5E5] rounded-t-[14px] rounded-b-none p-6">
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
                    <div className="text-[24px] sm:text-[28px] font-extrabold">
                      {product.name}
                    </div>
                    {product.brand && (
                      <div className="text-[18px] mt-1">{product.brand}</div>
                    )}
                  </div>

                  {/* Артикул / наличие */}
                  <div className="flex flex-col gap-3 mb-4 text-[16px]">
                    {product.sku && <div>Артикул: {product.sku}</div>}
                    <div>
                      <span className="inline-flex items-center px-3 py-1 border border-[#1C1A61] rounded-full text-[14px] font-medium">
                        {product.in_stock ? "В наличии" : "Нет в наличии"}
                      </span>
                    </div>
                  </div>

                  {/* Размеры */}
                  {sizes.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[16px] mb-2">Выберите размер</div>
                      <div className="inline-flex rounded-[10px] overflow-hidden border border-[#1C1A61]">
                        {sizes.map((sz) => {
                          const key =
                            typeof sz === "string"
                              ? sz
                              : sz.value || sz.label || sz.id;
                          const label =
                            typeof sz === "string"
                              ? sz
                              : sz.label || sz.title || sz.name || key;
                          const isActive = selectedSize === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedSize(key)}
                              className={[
                                "px-4 py-2 text-[15px] font-medium border-r border-[#1C1A61]/60 last:border-r-0",
                                isActive
                                  ? "bg-[#1C1A61] text-white"
                                  : "bg-white text-[#1C1A61] hover:bg-[#1C1A61]/5",
                              ].join(" ")}
                            >
                              {label}
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
                        {addingToCart ? "Добавляем..." : "Добавить в корзину"}
                      </button>

                      <button
                        type="button"
                        onClick={onToggleFavorite}
                        className="w-10 h-10 rounded-full border border-[#1C1A61]/40 flex items-center justify-center hover:border-[#EC1822] hover:text-[#EC1822] transition"
                        aria-label="Избранное"
                      >
                        {isFavorite ? "★" : "☆"}
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </div>

          {/* Нижний блок — описание, на всю ширину, с вырезом слева (как у профиля) */}

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

            <div className="relative z-10">
              <h2 className="text-[24px] sm:text-[30px] font-extrabold mb-4">
                Описание
              </h2>
              {loading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-full bg-[#1C1A61]/10 rounded" />
                  <div className="h-4 w-5/6 bg-[#1C1A61]/10 rounded" />
                  <div className="h-4 w-4/6 bg-[#1C1A61]/10 rounded" />
                </div>
              ) : product?.description ? (
                <div className="text-[16px] leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <div className="text-[16px] text-[#1C1A61]/70">
                  Описание будет добавлено позже.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
