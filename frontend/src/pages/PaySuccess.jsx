// src/pages/PaySuccess.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";
import api from "../lib/api";

const LAST_PAYMENT_KEY = "last_payment_ctx";

function readLastPayment() {
  try {
    const raw = localStorage.getItem(LAST_PAYMENT_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    return obj;
  } catch {
    return null;
  }
}

function clearLastPayment() {
  try {
    localStorage.removeItem(LAST_PAYMENT_KEY);
  } catch {}
}

export default function PaySuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // варианты, которые иногда приходят от платёжек
    const ordFromQuery =
      params.get("OrderId") || params.get("orderId") || params.get("order_id");

    const payFromQuery =
      params.get("PaymentId") ||
      params.get("paymentId") ||
      params.get("payment_id");

    const stored = readLastPayment();

    // fallback на localStorage если query пустой
    const order_id =
      ordFromQuery || stored?.order_id || stored?.orderId || null;
    const payment_id =
      payFromQuery || stored?.payment_id || stored?.paymentId || null;

    if (order_id) setOrderId(String(order_id));

    let alive = true;

    (async () => {
      try {
        // если вообще нет идентификаторов — синкать нечего
        if (!payment_id && !order_id) {
          if (alive) {
            setSyncError(
              "Оплата прошла, но не удалось определить идентификатор платежа. " +
                "Откройте страницу истории заказов — если заказа нет, сообщите в поддержку."
            );
          }
          // всё равно обновим корзину — чтобы UI был актуален
          try {
            await api.getCart();
            window.dispatchEvent(new Event("cart:changed"));
          } catch {}
          return;
        }

        // дергаем sync напрямую, не через api.js (чтобы не зависеть от его реализации)
        const res = await fetch("/api/payments/sync/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(localStorage.getItem("access")
              ? { Authorization: `Bearer ${localStorage.getItem("access")}` }
              : {}),
            ...(localStorage.getItem("anon_id")
              ? { "X-Anon-Id": localStorage.getItem("anon_id") }
              : {}),
          },
          body: JSON.stringify({
            payment_id: payment_id || null,
            order_id: order_id || null,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data?.detail || `sync failed: ${res.status}`);
        }

        // если синк подтвердил успех — можно очистить сохранённый контекст
        const status = String(data?.status || "").toUpperCase();
        const success =
          Boolean(data?.success) ||
          status === "CONFIRMED" ||
          status === "AUTHORIZED";
        if (success) {
          clearLastPayment();
        }

        // обновляем корзину (после mark_paid должна стать пустой/новой draft)
        await api.getCart();
        window.dispatchEvent(new Event("cart:changed"));
      } catch (e) {
        console.error("pay success sync error", e);
        if (alive) {
          setSyncError(
            "Платёж прошёл, но не удалось обновить данные заказа. " +
              "Попробуйте обновить страницу или зайти в профиль → история заказов."
          );
        }
        // всё равно попробуем обновить корзину
        try {
          await api.getCart();
          window.dispatchEvent(new Event("cart:changed"));
        } catch {}
      }
    })();

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

      {syncError && (
        <div className="mb-4 rounded-[14px] border px-5 py-3 text-[14px] bg-[#FFECEC] border-[#EC1822] text-[#7A1218]">
          {syncError}
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
