// src/pages/PaySuccess.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import api from "../lib/api";

export default function PaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(true);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // читаем параметры из урла, которые Т-банк может нам передать
    const params = new URLSearchParams(location.search);
    const ord =
      params.get("OrderId") || params.get("orderId") || params.get("order_id");
    if (ord) setOrderId(ord);

    // обновляем корзину (после успешной оплаты на бэке корзина должна быть очищена)
    let alive = true;
    (async () => {
      try {
        await api.getCart();
      } catch {
        // игнорим
      }
      if (!alive) return;
      // даём знать хедеру/контексту, что корзина изменилась
      window.dispatchEvent(new Event("cart:changed"));
    })();

    // автоскрытие плашки через 15 секунд
    const t = setTimeout(() => setVisible(false), 15000);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [location.search]);

  return (
    <Container className="font-[Actay] text-[#1C1A61] py-8">
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span>Оплата</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Оплата прошла успешно
      </h1>

      {visible && (
        <div className="mb-6 rounded-[14px] border px-5 py-4 text-[16px] bg-[#D9FBE3] border-[#1BB35C]">
          <div className="font-bold mb-1 text-[#064420]">Заказ оплачен</div>
          <div className="text-[#064420]">
            {orderId ? (
              <>
                Номер заказа: <span className="font-semibold">{orderId}</span>
              </>
            ) : (
              "Спасибо за покупку!"
            )}
          </div>
          <div className="mt-1 text-[#064420]/80 text-[14px]">
            Сообщение закроется автоматически через 15 секунд.
          </div>
        </div>
      )}

      <p className="text-[16px] mb-4">
        Детали заказа можно посмотреть в{" "}
        <Link
          to="/profile"
          className="underline underline-offset-4 hover:text-[#EC1822] transition"
        >
          личном кабинете
        </Link>
        .
      </p>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-2 inline-flex items-center justify-center rounded-[10px] px-6 h-[44px] bg-[#1C1A61] text-white text-[16px] font-semibold hover:bg-[#EC1822] transition"
      >
        На главную
      </button>
    </Container>
  );
}
