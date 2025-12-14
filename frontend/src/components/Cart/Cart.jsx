import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container";
import api from "../../lib/api";

function formatRub(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(num)
    .replace(/\u00A0/g, " ");
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="w-[120px] h-[120px] text-[#1C1A61]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 12h6l5 28h26l5-20H19"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 48a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM46 48a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function QtyControl({ value, onDec, onInc, disabled }) {
  return (
    <div className="inline-flex items-center border border-[#1C1A61] rounded-[10px] overflow-hidden h-[44px]">
      <button
        type="button"
        disabled={disabled}
        onClick={onDec}
        className="w-[48px] h-full grid place-items-center text-[24px] leading-none hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Уменьшить количество"
      >
        –
      </button>
      <div className="w-[54px] h-full grid place-items-center text-[18px] font-semibold">
        {value}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onInc}
        className="w-[48px] h-full grid place-items-center text-[22px] leading-none hover:bg-black/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}

function CartRow({ item, busy, onSetQty }) {
  const unitPrice = item.unitPrice ?? 0;
  const total = unitPrice * (item.qty ?? 1);

  return (
    <div className="bg-[#E5E5E5] rounded-[18px] p-[22px]">
      <div className="flex flex-col lg:flex-row gap-[22px] lg:items-center">
        <div className="shrink-0">
          <div className="w-[150px] h-[150px] rounded-[14px] border border-[#1C1A61] bg-[#F3F3F3] overflow-hidden flex items-center justify-center">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name || "Фото"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#1C1A61]/70 text-[18px] select-none">
                Фото
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* название кликабельно, ведёт на товар */}
          <div className="text-[#1C1A61] text-[26px] sm:text-[30px] font-extrabold leading-tight">
            {item.slug ? (
              <Link
                to={`/product/${item.slug}`}
                className="inline cursor-pointer hover:underline underline-offset-4 hover:text-[#EC1822] transition"
              >
                {item.name}
              </Link>
            ) : (
              item.name
            )}
          </div>

          <div className="mt-2 space-y-1 text-[16px] sm:text-[17px]">
            <div>
              <span className="text-[#1C1A61]/80">Размер: </span>
              <span className="font-semibold">{item.size || "—"}</span>
            </div>

            <div className="text-[#1C1A61]/80">
              {item.inStock ? "В наличии" : "Нет в наличии"}
            </div>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="text-[28px] sm:text-[32px] font-extrabold">
              {formatRub(unitPrice)}
            </div>
            <div className="text-[14px] sm:text-[15px] text-[#1C1A61]/80 pb-[3px]">
              цена за 1 шт
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-[18px] justify-between lg:justify-end lg:min-w-[360px]">
          <QtyControl
            value={item.qty}
            disabled={busy}
            onDec={() =>
              onSetQty(item.variantId, Math.max(0, (item.qty || 0) - 1))
            }
            onInc={() => onSetQty(item.variantId, (item.qty || 0) + 1)}
          />

          <div className="text-[#1C1A61] text-[34px] sm:text-[40px] font-extrabold whitespace-nowrap">
            {formatRub(total)} руб.
          </div>
        </div>
      </div>
    </div>
  );
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
    inStock: v.in_stock ?? true,
  };
}

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [serverTotal, setServerTotal] = useState("0.00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyMap, setBusyMap] = useState({});

  // ===== состояние промокода =====
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // {code, discountAmount, percent}
  const [userPromos, setUserPromos] = useState([]);

  // ===== состояние бонусов =====
  const [bonusInput, setBonusInput] = useState("");
  const [bonusError, setBonusError] = useState("");
  const [bonusBalance, setBonusBalance] = useState(0); // баланс пользователя
  const [bonusApplied, setBonusApplied] = useState(0); // сколько списали фактически

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCart();
      const list = (data?.items || [])
        .map(normalizeCartItem)
        .filter((i) => i.variantId);
      setItems(list);
      setServerTotal(String(data?.total ?? "0.00"));
    } catch {
      setItems([]);
      setServerTotal("0.00");
      setError("Не удалось загрузить корзину");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // подгружаем профиль, чтобы знать бонусы и промокоды пользователя
  useEffect(() => {
    if (!api.hasToken()) return;

    (async () => {
      try {
        const me = await api.getMe();
        console.log("me in Cart:", me);

        // 1) БАЛАНС БОНУСОВ
        // Берём teк же, как в Profile.jsx: total_bonus / bonuses
        let rawBonus =
          me?.total_bonus ??
          me?.bonuses ??
          me?.bonus_balance ??
          me?.bonus ??
          me?.points ??
          0;

        // rawBonus может быть строкой с пробелами — чистим
        if (typeof rawBonus === "string") {
          rawBonus = rawBonus.replace(/\s/g, "").replace(",", ".");
        }

        const bonusNum = Number(rawBonus);
        setBonusBalance(Number.isFinite(bonusNum) ? bonusNum : 0);

        // 2) ПРОМОКОДЫ ПОЛЬЗОВАТЕЛЯ (если бэк их вообще отдаёт)
        const promos = me?.promocodes ?? me?.promo_codes ?? me?.promos ?? [];

        setUserPromos(Array.isArray(promos) ? promos : []);
      } catch (e) {
        console.warn("Не удалось загрузить профиль для бонусов/промо", e);
        setBonusBalance(0);
        setUserPromos([]);
      }
    })();
  }, []);

  // "сырая" сумма корзины (без промо и бонусов)
  const derivedTotal = useMemo(() => {
    const t = Number.parseFloat(serverTotal);
    if (Number.isFinite(t)) return t;
    return items.reduce((acc, x) => acc + (x.unitPrice || 0) * (x.qty || 0), 0);
  }, [items, serverTotal]);

  // максимально можно списать бонусов: минимум из баланса и 40% суммы корзины
  const maxBonusAllowed = useMemo(() => {
    const base = derivedTotal || 0;
    if (base <= 0) return 0;
    const byPercent = base * 0.4;
    const byBalance = Number(bonusBalance) || 0;
    return Math.max(0, Math.min(byPercent, byBalance));
  }, [derivedTotal, bonusBalance]);

  // если корзина изменилась и наш списанный бонус больше allowed — подрезаем
  useEffect(() => {
    if (bonusApplied > maxBonusAllowed) {
      setBonusApplied(maxBonusAllowed || 0);
      if (!maxBonusAllowed) {
        setBonusInput("");
      }
    }
  }, [maxBonusAllowed, bonusApplied]);

  const setBusy = useCallback((variantId, flag) => {
    setBusyMap((prev) => {
      const next = { ...prev };
      if (flag) next[variantId] = true;
      else delete next[variantId];
      return next;
    });
  }, []);

  const onSetQty = useCallback(
    async (variantId, nextQty) => {
      if (!variantId) return;
      if (busyMap[variantId]) return;

      // optimistic
      setItems((prev) => {
        if (nextQty <= 0) return prev.filter((x) => x.variantId !== variantId);
        return prev.map((x) =>
          x.variantId === variantId ? { ...x, qty: nextQty } : x
        );
      });

      setBusy(variantId, true);
      try {
        await api.setCartItem(variantId, nextQty); // qty уходит на бэк
        const fresh = await api.getCart();
        const list = (fresh?.items || [])
          .map(normalizeCartItem)
          .filter((i) => i.variantId);
        setItems(list);
        setServerTotal(String(fresh?.total ?? "0.00"));
      } catch {
        await loadCart();
      } finally {
        setBusy(variantId, false);
      }
    },
    [busyMap, loadCart, setBusy]
  );

  const isEmpty = !loading && items.length === 0;

  // применение промокода
  const handleApplyPromo = useCallback(() => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Введите промокод");
      setAppliedPromo(null);
      return;
    }

    if (!api.hasToken()) {
      setPromoError("Для использования промокода нужно войти");
      return;
    }

    const base = derivedTotal || 0;
    if (base <= 0) {
      setPromoError("Корзина пуста");
      return;
    }

    // Если бэк реально отдаёт промокоды в me, пробуем поискать этот код
    let found = null;
    if (userPromos && userPromos.length) {
      const lower = code.toLowerCase();
      found = userPromos.find((p) => {
        const promoCode = (p.code || p.value || p.name || p.slug || "")
          .toString()
          .trim()
          .toLowerCase();
        return promoCode === lower;
      });

      if (!found) {
        setPromoError("Такой промокод вам недоступен");
        setAppliedPromo(null);
        return;
      }
    }

    // Дальше считаем скидку
    let percent = 0;
    let fixed = 0;

    if (found) {
      // читаем поля, как они есть в объекте промо
      percent = Number(
        found.percent ??
          found.discount_percent ??
          found.perc ??
          found.value_percent ??
          0
      );
      fixed = Number(
        found.amount ?? found.discount_amount ?? found.value_fix ?? 0
      );
    } else {
      // ❗ если userPromos пустой и мы не знаем правил — пока не даём скидку,
      // только запоминаем, что код введён (к логике на этапе оплаты)
      setAppliedPromo({
        code,
        discountAmount: 0,
        percent: null,
      });
      setPromoError(
        "Промокод сохранён, но скидка пока не рассчитывается на этой стадии"
      );
      return;
    }

    let discount = 0;
    let usedPercent = null;

    if (Number.isFinite(percent) && percent > 0) {
      discount = (base * percent) / 100;
      usedPercent = percent;
    } else if (Number.isFinite(fixed) && fixed > 0) {
      discount = fixed;
    } else {
      setPromoError("Не удалось определить размер скидки по промокоду");
      setAppliedPromo(null);
      return;
    }

    discount = Math.min(discount, base);

    setAppliedPromo({
      code,
      discountAmount: discount,
      percent: usedPercent,
    });
    setPromoError("");
  }, [promoInput, userPromos, derivedTotal]);

  // применение бонусов
  const handleApplyBonus = useCallback(() => {
    if (!api.hasToken()) {
      setBonusError("Для списания бонусов нужно войти");
      return;
    }

    const raw = bonusInput.trim();
    if (!raw) {
      setBonusError("Введите количество бонусов");
      setBonusApplied(0);
      return;
    }

    const num = Number(raw);
    if (!Number.isFinite(num) || num <= 0) {
      setBonusError("Некорректное количество бонусов");
      setBonusApplied(0);
      return;
    }

    if (maxBonusAllowed <= 0) {
      setBonusError("Сейчас бонусы нельзя списать");
      setBonusApplied(0);
      return;
    }

    if (num > maxBonusAllowed) {
      setBonusError(
        `Максимум можно списать ${formatRub(maxBonusAllowed)} бонусов`
      );
      setBonusApplied(maxBonusAllowed);
      return;
    }

    setBonusApplied(num);
    setBonusError("");
  }, [bonusInput, maxBonusAllowed]);

  // финальная сумма = корзина - скидка по промо - списанные бонусы
  const finalTotal = useMemo(() => {
    const base = derivedTotal || 0;
    const promo = appliedPromo?.discountAmount || 0;
    const bonus = bonusApplied || 0;
    const raw = base - promo - bonus;
    return raw > 0 ? raw : 0;
  }, [derivedTotal, appliedPromo, bonusApplied]);

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-[64px]">
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span>Корзина</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Корзина
      </h1>

      <div className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
        <div className="flex flex-col lg:flex-row gap-[26px] lg:items-center">
          <div className="shrink-0 flex items-center justify-center lg:justify-start">
            <CartIcon />
          </div>

          <div className="flex-1 grid gap-[16px]">
            {/* ПРОМОКОД */}
            <div className="grid gap-2">
              <div className="text-[16px] sm:text-[18px]">
                Введите промокод:
              </div>
              <div className="flex gap-3 items-center">
                <input
                  value={promoInput}
                  onChange={(e) => {
                    setPromoInput(e.target.value);
                    setPromoError("");
                  }}
                  className="w-full max-w-[360px] h-[44px] rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 text-[18px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="h-[44px] px-5 rounded-[10px] bg-[#1C1A61] text-white text-[18px] font-semibold hover:bg-[#EC1822] transition"
                >
                  Готово
                </button>
              </div>
              {promoError && (
                <div className="text-[14px] text-[#EC1822]">{promoError}</div>
              )}
              {appliedPromo && (
                <div className="text-[14px] text-[#1C1A61]/80">
                  Промокод{" "}
                  <span className="font-semibold">{appliedPromo.code}</span>{" "}
                  применён, скидка{" "}
                  {appliedPromo.percent
                    ? `${appliedPromo.percent}%`
                    : `${formatRub(appliedPromo.discountAmount)} ₽`}
                  .
                </div>
              )}
            </div>

            {/* БОНУСЫ */}
            <div className="grid gap-2">
              <div className="text-[16px] sm:text-[18px]">Списать бонусы:</div>
              <div className="flex gap-3 items-center">
                <input
                  value={bonusInput}
                  onChange={(e) => {
                    // разрешаем только цифры
                    const v = e.target.value.replace(/[^\d]/g, "");
                    setBonusInput(v);
                    setBonusError("");
                  }}
                  className="w-full max-w-[360px] h-[44px] rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 text-[18px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyBonus}
                  className="h-[44px] px-5 rounded-[10px] bg-[#1C1A61] text-white text-[18px] font-semibold hover:bg-[#EC1822] transition"
                >
                  Готово
                </button>
              </div>
              {bonusError && (
                <div className="text-[14px] text-[#EC1822]">{bonusError}</div>
              )}
              {bonusBalance > 0 && (
                <div className="text-[14px] text-[#1C1A61]/70">
                  Ваш баланс: {formatRub(bonusBalance)} бонусов.
                </div>
              )}
              {maxBonusAllowed > 0 && (
                <div className="text-[14px] text-[#1C1A61]/70">
                  Можно списать до {formatRub(maxBonusAllowed)} бонусов (не
                  более 40% от суммы корзины).
                </div>
              )}
              {bonusApplied > 0 && (
                <div className="text-[14px] text-[#1C1A61]/80">
                  Списано бонусов: {formatRub(bonusApplied)}.
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 lg:pl-[10px]">
            <div className="text-[18px]">Сумма:</div>
            <div className="text-[38px] sm:text-[44px] font-extrabold leading-none mt-1 whitespace-nowrap">
              {formatRub(finalTotal)} руб.
            </div>

            <button
              type="button"
              className="mt-4 h-[44px] px-6 rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] text-[#1C1A61] text-[16px] font-semibold hover:bg-[#1C1A61] hover:text:white transition disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={loading || items.length === 0}
              onClick={() => {
                navigate("/checkout", {
                  state: {
                    appliedPromo, // объект с info по промику
                    bonusApplied, // сколько списали бонусов
                  },
                });
              }}
            >
              Оформить заказ
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-6 text-[#EC1822] text-[16px]">{error}</div>
      ) : null}
      {loading ? (
        <div className="mt-6 text-[16px] text-[#1C1A61]/70">Загрузка…</div>
      ) : null}
      {isEmpty ? (
        <div className="mt-6 text-[18px] text-[#1C1A61]/80">
          В корзине пока нет товаров.
        </div>
      ) : null}

      {/* список товаров */}
      <div className="mt-6 space-y-4">
        {items.map((it) => (
          <CartRow
            key={it.variantId}
            item={it}
            busy={!!busyMap[it.variantId]}
            onSetQty={onSetQty}
          />
        ))}
      </div>
    </Container>
  );
}
