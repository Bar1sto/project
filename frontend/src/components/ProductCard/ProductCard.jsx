// src/components/ProductCard/ProductCard.jsx
import { useState } from "react";

// можно оставить png — как было у тебя
import HeartIcon from "../../assets/icons/heart.svg?react";
import { formatPrice } from "../../utils/format";


/**
 * Ожидаем props.product:
 * {
 *   image: string,
 *   name: string,
 *   brand?: string,
 *   price: number,
 *   is_new?: boolean,
 *   is_sale?: boolean
 * }
 */
export default function ProductCard({ product }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const formatPrice = (n) =>

  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n).replace(/\u00A0/g, " ");
  
  const priceText = formatPrice(product?.price)

  return (
    <article
      className="
        font-[Actay]
        bg-[#E5E5E5] rounded-[10px] overflow-hidden
        w-[250px] h-[500px]
        flex flex-col
        transition-all duration-300
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
          <p className="text-[36px] font-bold mb-[1px] px-[8px] whitespace-nowrap ">9999</p>

          {/* кнопки */}
          <div className="flex justify-center gap-[8px] px-[8px]">
            {/* В КОРЗИНУ — как было в CSS */}
            <button
              type="button"
              className="
          flex-1
          bg-[#1C1A61] text-white
          px-[12px] py-[8px] rounded-[10px]
          text-[24px]
          transition-colors duration-300
          hover:bg-[#EC1822]
        "
            >
              В корзину
            </button>

            {/* ИЗБРАННОЕ — контур по умолчанию, заливка при клике */}
            <button
              type="button"
              onClick={() => setIsFavorite((v) => !v)}
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
