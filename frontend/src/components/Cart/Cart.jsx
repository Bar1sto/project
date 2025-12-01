// src/pages/Cart/Cart.jsx (или где у тебя лежит)
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/ui/Container";

function formatRub(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 })
    .format(num)
    .replace(/\u00A0/g, " ");
}

function CartIcon() {
  // простой аккуратный cart (в стиле твоего дизайна)
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

function QtyControl({ value }) {
  return (
    <div className="inline-flex items-center border border-[#1C1A61] rounded-[10px] overflow-hidden h-[44px]">
      <button
        type="button"
        className="w-[48px] h-full grid place-items-center text-[24px] leading-none hover:bg-black/5 transition"
        aria-label="Уменьшить количество"
      >
        –
      </button>
      <div className="w-[54px] h-full grid place-items-center text-[18px] font-semibold">
        {value}
      </div>
      <button
        type="button"
        className="w-[48px] h-full grid place-items-center text-[22px] leading-none hover:bg-black/5 transition"
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}

function CartRow({ item }) {
  const unitPrice = item.unitPrice ?? item.price ?? 0;
  const total = unitPrice * (item.qty ?? 1);

  return (
    <div className="bg-[#E5E5E5] rounded-[18px] p-[22px]">
      <div className="flex flex-col lg:flex-row gap-[22px] lg:items-center">
        {/* Фото */}
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

        {/* Текст слева */}
        <div className="flex-1 min-w-0">
          <div className="text-[#1C1A61] text-[26px] sm:text-[30px] font-extrabold leading-tight">
            {item.name}
          </div>

          <div className="mt-2 space-y-1 text-[16px] sm:text-[17px]">
            <div>
              <span className="text-[#1C1A61]/80">Размер: </span>
              <span className="font-semibold">{item.size}</span>
            </div>

            {/* Арт. НЕ показываем (как ты просил) */}

            <div className="text-[#1C1A61]/80">
              {item.inStock ? "В наличии" : "Нет в наличии"}
            </div>
          </div>

          {/* Цена за 1шт */}
          <div className="mt-4 flex items-end gap-3">
            <div className="text-[28px] sm:text-[32px] font-extrabold">
              {formatRub(unitPrice)}
            </div>
            <div className="text-[14px] sm:text-[15px] text-[#1C1A61]/80 pb-[3px]">
              цена за 1 шт
            </div>
          </div>
        </div>

        {/* Управление + итог справа */}
        <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-[18px] justify-between lg:justify-end lg:min-w-[360px]">
          <QtyControl value={item.qty} />

          <div className="text-[#1C1A61] text-[34px] sm:text-[40px] font-extrabold whitespace-nowrap">
            {formatRub(total)} руб.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  // пока мок-данные для идеальной верстки (потом подключим реальные)
  const [items] = useState([
    {
      id: 1,
      name: "Трусы игрока CCM AS580 JR",
      size: "S",
      inStock: true,
      qty: 1,
      unitPrice: 10990,
      image: null,
    },
    {
      id: 2,
      name: "Трусы игрока CCM AS580 JR",
      size: "S",
      inStock: true,
      qty: 1,
      unitPrice: 10990,
      image: null,
    },
    {
      id: 3,
      name: "Трусы игрока CCM AS580 JR",
      size: "S",
      inStock: true,
      qty: 1,
      unitPrice: 10990,
      image: null,
    },
  ]);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, x) => acc + Number(x.unitPrice || 0) * (x.qty || 1),
        0
      ),
    [items]
  );

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-[64px]">
      {/* Хлебные крошки */}
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

      {/* Верхний блок (иконка + промо/бонус + сумма) */}
      <div className="bg-[#E5E5E5] rounded-[18px] p-[22px] sm:p-[28px]">
        <div className="flex flex-col lg:flex-row gap-[26px] lg:items-center">
          {/* Иконка */}
          <div className="shrink-0 flex items-center justify-center lg:justify-start">
            <CartIcon />
          </div>

          {/* Промо + бонусы */}
          <div className="flex-1 grid gap-[16px]">
            <div className="grid gap-2">
              <div className="text-[16px] sm:text-[18px]">
                Введите промокод:
              </div>
              <div className="flex gap-3 items-center">
                <input
                  className="w-full max-w-[360px] h-[44px] rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 text-[18px] outline-none"
                  placeholder=""
                />
                <button
                  type="button"
                  className="h-[44px] px-5 rounded-[10px] bg-[#1C1A61] text-white text-[18px] font-semibold hover:bg-[#EC1822] transition"
                >
                  Готово
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-[16px] sm:text-[18px]">Списать бонусы:</div>
              <div className="flex gap-3 items-center">
                <input
                  className="w-full max-w-[360px] h-[44px] rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] px-4 text-[18px] outline-none"
                  placeholder=""
                />
                <button
                  type="button"
                  className="h-[44px] px-5 rounded-[10px] bg-[#1C1A61] text-white text-[18px] font-semibold hover:bg-[#EC1822] transition"
                >
                  Готово
                </button>
              </div>
            </div>
          </div>

          {/* Сумма + оформить */}
          <div className="shrink-0 lg:pl-[10px]">
            <div className="text-[18px]">Сумма:</div>
            <div className="text-[38px] sm:text-[44px] font-extrabold leading-none mt-1 whitespace-nowrap">
              {formatRub(total)} руб.
            </div>

            <button
              type="button"
              className="mt-4 h-[44px] px-6 rounded-[10px] border border-[#1C1A61] bg-[#E5E5E5] text-[#1C1A61] text-[16px] font-semibold hover:bg-[#1C1A61] hover:text-white transition"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      </div>

      {/* Список товаров */}
      <div className="mt-6 space-y-5">
        {items.map((it) => (
          <CartRow key={it.id} item={it} />
        ))}
      </div>
    </Container>
  );
}
