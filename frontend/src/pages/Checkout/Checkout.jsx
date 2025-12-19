// src/pages/Checkout/Checkout.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container";
import api from "../../lib/api";

function formatRub(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(num)
    .replace(/\u00A0/g, " ");
}

function normalizeCartItem(x) {
  const v = x?.variant || {};
  const size =
    [v.size_type, v.size_value].filter(Boolean).join(" ").trim() || "—";

  return {
    variantId: Number(x?.variant_id),
    qty: Number(x?.qty) || 0,
    unitPrice: Number.parseFloat(x?.price) || 0,
    name: x?.product?.name || "Товар",
    slug: x?.product?.slug || null,
    image: x?.product?.image || null,
    size,
  };
}

// ⚙️ Точки самовывоза
const PICKUP_POINTS = [
  {
    id: "krasnodar",
    label: "г. Краснодар, ул. Соколова, 17",
  },
  {
    id: "maykop",
    label: "г. Майкоп, ул. Васильева, д.2, корпус 4",
  },
];

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // если из корзины будем передавать скидки/бонусы
  const passedState = location.state || {};
  const passedPromo = passedState.appliedPromo || null;
  const passedBonus = passedState.bonusApplied || 0;

  const [items, setItems] = useState([]);
  const [serverTotal, setServerTotal] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // доставка / самовывоз
  const [deliveryType, setDeliveryType] = useState(null); // 'pickup' | 'delivery'
  const [address, setAddress] = useState("");
  const [addressComment, setAddressComment] = useState("");

  // выбранный пункт самовывоза
  const [pickupId, setPickupId] = useState(PICKUP_POINTS[0].id);

  // грузим корзину ещё раз, чтобы были свежие данные
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getCart();
        const list = (data?.items || [])
          .map(normalizeCartItem)
          .filter((i) => i.variantId);
        setItems(list);
        setServerTotal(String(data?.total ?? "0.00"));
      } catch (e) {
        console.error("load checkout cart error", e);
        setItems([]);
        setServerTotal("0.00");
        setError("Не удалось загрузить корзину");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // базовая сумма корзины (как на бэке)
  const baseTotal = useMemo(() => {
    const t = Number.parseFloat(serverTotal);
    if (Number.isFinite(t)) return t;
    return items.reduce((acc, x) => acc + (x.unitPrice || 0) * (x.qty || 0), 0);
  }, [items, serverTotal]);

  // скидка по промокоду и бонусы (пока берём из location.state)
  const promoDiscount = passedPromo?.discountAmount || 0;
  const bonusDiscount = passedBonus || 0;

  const finalTotal = useMemo(() => {
    const raw = (baseTotal || 0) - (promoDiscount || 0) - (bonusDiscount || 0);
    return raw > 0 ? raw : 0;
  }, [baseTotal, promoDiscount, bonusDiscount]);

  const isEmpty = !loading && items.length === 0;

  // адрес выбранного пункта самовывоза
  const pickupAddress = useMemo(() => {
    const found =
      PICKUP_POINTS.find((p) => p.id === pickupId) || PICKUP_POINTS[0];
    return found.label;
  }, [pickupId]);

  const canPay = useMemo(() => {
    if (loading || isEmpty) return false;
    if (!deliveryType) return false;

    if (deliveryType === "pickup") {
      // пункт самовывоза выбран всегда (по умолчанию Краснодар),
      // адрес не вводится вручную
      return true;
    }

    if (deliveryType === "delivery") {
      return address.trim().length >= 5;
    }

    return false;
  }, [loading, isEmpty, deliveryType, address]);

  const handlePayClick = async () => {
    if (!canPay) return;

    const finalAddress =
      deliveryType === "pickup" ? pickupAddress : address.trim();

    try {
      const payload = {
        delivery_type: deliveryType, // "pickup" | "delivery"
        address: finalAddress, // строка адреса / магазина
        address_comment: addressComment || "", // комментарий к адресу
        pickup_id: deliveryType === "pickup" ? pickupId : null,
      };

      const data = await api.initPayment(payload);

      if (data && data.payment_url) {
        // уходим в платёжную форму Т-банка
        window.location.href = data.payment_url;
      } else {
        console.error("initPayment: нет payment_url в ответе", data);
        alert("Не удалось получить ссылку на оплату. Попробуйте ещё раз.");
      }
    } catch (e) {
      console.error("initPayment error", e);
      alert("Не удалось запустить оплату. Попробуйте ещё раз.");
    }
  };

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-[64px]">
      {/* Крошки */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <Link to="/cart" className="hover:text-[#EC1822] transition">
          Корзина
        </Link>
        <span className="px-2">›</span>
        <span>Оформление заказа</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Оформление заказа
      </h1>

      {error && <div className="mb-4 text-[16px] text-[#EC1822]">{error}</div>}

      {loading && (
        <div className="mb-4 text-[16px] text-[#1C1A61]/70">Загрузка…</div>
      )}

      {isEmpty && !loading ? (
        <div className="text-[18px] text-[#1C1A61]/80">
          В корзине нет товаров.{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="underline underline-offset-2 hover:text-[#EC1822]"
          >
            Вернуться в каталог
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Левая колонка */}
          <div className="space-y-6">
            {/* Сводка по товарам */}
            <section className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
              <h2 className="text-[24px] sm:text-[30px] font-extrabold mb-4">
                Ваш заказ
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="border border-[#1C1A61]/20 rounded-[12px] p-3 sm:p-4 flex gap-3 sm:gap-4 items-center bg-[#F3F3F3]"
                  >
                    <div className="w-[70px] h-[70px] rounded-[10px] border border-[#1C1A61]/40 bg:white flex items-center justify-center overflow-hidden shrink-0 bg-white">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
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
                        {item.name}
                      </div>
                      <div className="text-[14px] text-[#1C1A61]/70 mt-1">
                        Размер: {item.size || "—"}
                      </div>
                      <div className="text-[14px] text-[#1C1A61]/70">
                        Количество: {item.qty} шт.
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[18px] sm:text-[20px] font-extrabold">
                        {formatRub(item.unitPrice * item.qty)} ₽
                      </div>
                      {item.qty > 1 && (
                        <div className="text-[12px] text-[#1C1A61]/60">
                          {formatRub(item.unitPrice)} ₽ / шт
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Способ получения */}
            <section className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
              <h2 className="text-[20px] sm:text-[24px] font-extrabold mb-4">
                Способ получения
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={[
                    "flex-1 rounded-[12px] border px-4 py-3 text-left transition",
                    deliveryType === "pickup"
                      ? "border-[#1C1A61] bg-white"
                      : "border-[#1C1A61]/40 bg-[#E5E5E5] hover:bg:white/60",
                  ].join(" ")}
                >
                  <div className="flex items:center justify-between gap-2">
                    <span className="text-[16px] sm:text-[18px] font-semibold">
                      Самовывоз
                    </span>
                    <span
                      className={[
                        "w-5 h-5 rounded-full border flex items-center justify-center",
                        deliveryType === "pickup"
                          ? "border-[#1C1A61] bg-[#1C1A61]"
                          : "border-[#1C1A61]/40",
                      ].join(" ")}
                    >
                      {deliveryType === "pickup" && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-[#1C1A61]/70">
                    Забрать из магазина
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={[
                    "flex-1 rounded-[12px] border px-4 py-3 text-left transition",
                    deliveryType === "delivery"
                      ? "border-[#1C1A61] bg-white"
                      : "border-[#1C1A61]/40 bg-[#E5E5E5] hover:bg-white/60",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[16px] sm:text-[18px] font-semibold">
                      Доставка
                    </span>

                    {/* 🔵 индикатор выбора, такой же как у Самовывоз */}
                    <span
                      className={[
                        "w-5 h-5 rounded-full border flex items-center justify-center",
                        deliveryType === "delivery"
                          ? "border-[#1C1A61] bg-[#1C1A61]"
                          : "border-[#1C1A61]/40",
                      ].join(" ")}
                    >
                      {deliveryType === "delivery" && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                  </div>
                  <div className="mt-1 text-[14px] text-[#1C1A61]/70">
                    Курьерская доставка по адресу
                  </div>
                </button>
              </div>
            </section>

            {/* Адрес — в зависимости от способа */}
            {deliveryType && (
              <section className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
                <h2 className="text-[20px] sm:text-[24px] font-extrabold mb-4">
                  Адрес
                </h2>

                {deliveryType === "pickup" ? (
                  <div className="space-y-3">
                    <div className="text-[14px] text-[#1C1A61]/80">
                      Выберите магазин самовывоза:
                    </div>

                    <div className="space-y-2">
                      {PICKUP_POINTS.map((p) => {
                        const active = pickupId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPickupId(p.id)}
                            className={[
                              "w-full flex items-center justify-between px-4 py-2 rounded-[10px] border transition text-left",
                              active
                                ? "border-[#1C1A61] bg-white"
                                : "border-[#1C1A61]/40 bg-[#E5E5E5] hover:bg-white/60",
                            ].join(" ")}
                          >
                            <span className="text-[14px] sm:text-[15px]">
                              {p.label}
                            </span>

                            {/* 🔵 Радио-точка в таком же стиле, как у Самовывоз/Доставка */}
                            <span
                              className={[
                                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3",
                                active
                                  ? "border-[#1C1A61] bg-[#1C1A61]"
                                  : "border-[#1C1A61]/40",
                              ].join(" ")}
                            >
                              {active && (
                                <span className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="text-[13px] text-[#1C1A61]/70">
                        Выбранный адрес:
                      </div>
                      <input
                        value={pickupAddress}
                        readOnly
                        className="w-full h-[44px] rounded:[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 text-[16px] outline-none cursor-not-allowed"
                      />
                      <div className="text-[12px] text-[#1C1A61]/60">
                        Адрес самовывоза заполняется автоматически и не
                        редактируется.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[14px] text-[#1C1A61]/80">
                      Укажите полный адрес доставки:
                    </div>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      placeholder="Город, улица, дом, квартира"
                      className="w-full rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 py-2 text-[16px] outline-none"
                    />
                    <textarea
                      value={addressComment}
                      onChange={(e) => setAddressComment(e.target.value)}
                      rows={2}
                      placeholder="Комментарий для курьера (необязательно)"
                      className="w-full rounded-[10px] border border-[#1C1A61]/60 bg-[#E5E5E5] px-4 py-2 text-[14px] outline-none"
                    />
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Правая колонка: итоги */}
          <aside className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px] h-fit">
            <h2 className="text-[22px] sm:text-[26px] font-exрабold mb-4">
              Итоги заказа
            </h2>

            <div className="space-y-2 text-[15px] sm:text-[16px]">
              <div className="flex justify-between">
                <span className="text-[#1C1A61]/80">Сумма товаров</span>
                <span className="font-semibold">{formatRub(baseTotal)} ₽</span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between text-[#1C1A61]">
                  <span>Скидка по промокоду</span>
                  <span className="font-semibold">
                    −{formatRub(promoDiscount)} ₽
                  </span>
                </div>
              )}

              {bonusDiscount > 0 && (
                <div className="flex justify-between text-[#1C1A61]">
                  <span>Списано бонусов</span>
                  <span className="font-semibold">
                    −{formatRub(bonusDiscount)} ₽
                  </span>
                </div>
              )}

              <div className="border-t border-[#1C1A61]/20 my-3" />

              <div className="flex justify-between items-baseline">
                <span className="text-[16px] sm:text-[18px]">К оплате</span>
                <span className="text-[28px] sm:text-[34px] font-extrabold">
                  {formatRub(finalTotal)} ₽
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePayClick}
              disabled={!canPay}
              className={[
                "mt-6 w-full h-[48px] rounded-[10px] text-[18px] font-semibold transition",
                canPay
                  ? "bg-[#1C1A61] text-white hover:bg-[#EC1822]"
                  : "bg-[#1C1A61]/40 text-white/80 cursor-not-allowed",
              ].join(" ")}
            >
              Оплатить
            </button>

            {!deliveryType && (
              <div className="mt-2 text-[13px] text-[#1C1A61]/70">
                Выберите способ получения, чтобы продолжить.
              </div>
            )}
            {deliveryType === "delivery" && address.trim().length < 5 && (
              <div className="mt-2 text-[13px] text-[#1C1A61]/70">
                Укажите адрес доставки.
              </div>
            )}
          </aside>
        </div>
      )}
    </Container>
  );
}
