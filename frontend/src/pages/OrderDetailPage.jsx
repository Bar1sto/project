import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Container from "../components/ui/Container";
import api from "../lib/api";

function formatRub(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(num)
    .replace(/\u00A0/g, " ");
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await api.getOrderDetail(orderId);
        if (!alive) return;

        setOrder(data);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        console.error("load order detail error", e);
        if (!alive) return;
        setError("Не удалось загрузить заказ");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orderId]);

  const total = useMemo(() => {
    if (!order) return 0;
    const t = Number.parseFloat(order.total);
    return Number.isFinite(t) ? t : 0;
  }, [order]);

  const address = order?.shipping_address || "—";

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-[64px]">
      {/* Хлебные крошки в стиле остальных страниц */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <Link to="/profile" className="hover:text-[#EC1822] transition">
          Личный кабинет
        </Link>
        <span className="px-2">›</span>
        <span>Заказ № {order?.number || orderId}</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Заказ № {order?.number || orderId}
      </h1>

      {loading && (
        <div className="text-[16px] text-[#1C1A61]/70">Загрузка…</div>
      )}

      {error && !loading && (
        <div className="text-[16px] text-[#EC1822] mb-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Левая колонка — товары (стили максимально близки к Checkout/Cart) */}
          <section className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold mb-4">
              Состав заказа
            </h2>

            {items.length === 0 ? (
              <div className="text-[16px] text-[#1C1A61]/70">
                В этом заказе нет позиций.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((it) => (
                  <div
                    key={it.variant_id}
                    className="border border-[#1C1A61]/20 rounded-[12px] p-3 sm:p-4 flex gap-3 sm:gap-4 items-center bg-[#F3F3F3]"
                  >
                    <div className="w-[70px] h-[70px] rounded-[10px] border border-[#1C1A61]/30 flex items-center justify-center overflow-hidden shrink-0 bg-white">
                      {it.product?.image ? (
                        <img
                          src={it.product.image}
                          alt={it.product?.name || "Товар"}
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
                        {it.product?.name || "Товар"}
                      </div>
                      <div className="text-[13px] sm:text-[14px] text-[#1C1A61]/70 mt-1">
                        Размер: {it.variant?.size_value || "—"}
                      </div>
                      <div className="text-[13px] sm:text-[14px] text-[#1C1A61]/70">
                        Кол-во: {it.qty}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[16px] font-semibold">
                        {formatRub(it.price)} ₽
                      </div>
                      <div className="text-[12px] text-[#1C1A61]/70">
                        за 1 шт
                      </div>
                      <div className="mt-1 text-[16px] sm:text-[18px] font-extrabold">
                        {formatRub(it.line_total)} ₽
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Правая колонка — краткая инфа */}
          <aside className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px] h-fit">
            <h2 className="text-[20px] sm:text-[24px] font-extrabold mb-4">
              Итоги
            </h2>

            <div className="space-y-2 text-[15px] sm:text-[16px]">
              <div className="flex justify-between">
                <span className="text-[#1C1A61]/80">Номер заказа</span>
                <span className="font-semibold">
                  {order?.number || orderId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#1C1A61]/80">Дата</span>
                <span className="font-semibold">{order?.date || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="font-semibold"></span>
              </div>

              <div className="pt-2 mt-2 border-t border-[#1C1A61]/10">
                <div className="text-[#1C1A61]/80 mb-1">Адрес доставки</div>
                <div className="font-semibold whitespace-pre-line">
                  {address}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#1C1A61]/10">
              <div className="text-[16px] text-[#1C1A61]/80 mb-1">
                Итоговая сумма
              </div>
              <div className="text-[28px] sm:text-[32px] font-extrabold">
                {formatRub(total)} ₽
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="mt-6 w-full h-[44px] rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] text-[#1C1A61] text-[16px] font-semibold hover:bg-[#1C1A61] hover:text-white transition"
            >
              Назад в профиль
            </button>
          </aside>
        </div>
      )}
    </Container>
  );
}
