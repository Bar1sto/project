// Один флаг на весь проект: false — рисуем твою статику, true — берём из бэка
export const USE_API = true;

// Эндпоинты под твой бэк (поменяешь при необходимости)
export const API = {
  popular: "/products/?popular=1&limit=8",
  fresh: "/products/?is_new=1&limit=8",
  sale: "/products/?is_sale=1&limit=8",
};

export function mapToCardShape(p) {
  const priceRaw = p?.min_price ?? p?.price ?? null;
  const price = priceRaw === null || priceRaw === "" ? null : Number(priceRaw);

  return {
    id: p.slug || p.id,
    slug: p.slug, // важно для роутинга
    name: p.name,
    brand: p?.brand?.name || p?.brand || "",
    type: p?.type || "",

    price: Number.isFinite(price) ? price : null,

    // флаги строго с сервера (поддержка is_Hit)
    isHit: !!(p?.is_hit ?? p?.is_Hit),
    isNew: !!p?.is_new,
    isSale: !!p?.is_sale,
    isFavorited: !!p?.is_favorited,
    image: p?.image || null,
  };
}
