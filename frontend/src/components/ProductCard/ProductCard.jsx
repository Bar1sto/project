import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeartIcon from "../../assets/icons/heart.svg?react";
import api from "../../lib/api";

export default function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const slug = product.slug || product.id;
  const navigate = useNavigate();
  const goToProduct = () => navigate(`/product/${encodeURIComponent(slug)}`);
  const [qty, setQty] = useState(0);
  const [variantId, setVariantId] = useState(null);
  const [cartBudy, SetCartBusy] = useState(false);

  const formatPrice = (n) =>
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
      .format(n)
      .replace(/\u00A0/g, " ");

  const priceText = formatPrice(product?.price);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!slug) return;
        const detail = await api.getProduct(slug);
        const first = (detail?.variants || [])[0];
        if (!alive) return;
        setVariantId(first?.id ?? null);
      } catch {
        // если не получилось — просто не даём работать корзине (пока)
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

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
            alt={product?.name || "Фото товара"}
            className="max-w-full max-h-[180px] object-contain"
          />
        ) : (
          <div
            className="
              w-full h-[180px] flex items-center justify-center
              text-[24px] text-[#1C1A61]
            "
          >
            ФОТО
          </div>
        )}
      </div>

      {/* инфо-блок карточки */}
      <div className="flex-1 flex flex-col px-[16px] text-[#1C1A61]">
        {/* BADGE "ХИТ" (фиксированно показать — оставь как есть) */}
        <span
          className="
      inline-block
      w-[42px] h-[20px] rounded-full mt-[15px]
      bg-[#EC1822] text-white
      text-[12px] leading-[16px]
      px-[8px] py-[2px] mb-[6px]
    "
        >
          ХИТ
        </span>

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
            9999
          </p>

          {/* кнопки */}
          <div className="flex justify-center gap-[8px] px-[8px]">
            {/* В КОРЗИНУ — как было в CSS */}
            {qty <= 0 ? (
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!variantId || cartBusy) return;
                  setCartBusy(true);
                  try {
                    await api.setCartItem(variantId, 1);
                    setQty(1);
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
                    if (!variantId || cartBusy) return;
                    const next = qty - 1;
                    setCartBusy(true);
                    try {
                      if (next <= 0) {
                        await api.deleteCartItem(variantId);
                        setQty(0);
                      } else {
                        await api.setCartItem(variantId, next);
                        setQty(next);
                      }
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
                    if (!variantId || cartBusy) return;
                    const next = qty + 1;
                    setCartBusy(true);
                    try {
                      await api.setCartItem(variantId, next);
                      setQty(next);
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
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorite((v) => !v);
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
                  // сам размер иконки (30×26)
                  "w-[30px] h-[26px]",

                  // По умолчанию — контур синим, пустая внутри:
                  // (stroke берёт currentColor; fill убираем)
                  isFavorite
                    ? "text-[#EC1822] [&_*]:fill-current"
                    : "text-[#1C1A61] [&_*]:fill-transparent",
                  // делаем обводку видимой и толстой
                  "[&_*]:stroke-current [&_*]:stroke-2",
                  // на hover — красный контур (когда НЕ избранное)
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
