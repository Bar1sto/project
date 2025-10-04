// Один флаг на весь проект: false — рисуем твою статику, true — берём из бэка
export const USE_API = true;

// Эндпоинты под твой бэк (поменяешь при необходимости)
export const API = {
  popular: "/api/products/?popular=1&limit=8",
  fresh:   "/api/products/?is_new=1&limit=8",
  sale:    "/api/products/?is_sale=1&limit=8",
};

// Маппер → приводим ответ бэка к твоей структуре карточки в секциях
export function mapToCardShape(p) {
  return {
    id: p.slug || p.id,
    name: p.name,
    brand: p?.brand?.name || p?.brand || "",
    type: p?.type || "",                // если у тебя такого поля нет — оставим пустым
    // цену НЕ трогаем (ты просил не форматировать) — пусть будет число или строка
    price: p?.price ?? p?.variants?.[0]?.current_price ?? "",
    // в твоей статике было isHit — делаем из is_new
    isHit: !!(p?.is_new),
    image: p?.image || "/images/pr.png",
  };
}