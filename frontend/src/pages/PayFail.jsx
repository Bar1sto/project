// src/pages/PayFail.jsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../components/ui/Container";

export default function PayFail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(t);
  }, []);

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
        Оплата не прошла
      </h1>

      {visible && (
        <div className="mb-6 rounded-[14px] border px-5 py-4 text-[16px] bg-[#FCE4E4] border-[#EC1822]">
          <div className="font-bold mb-1 text-[#7A0710]">
            Произошла ошибка при оплате
          </div>
          <div className="text-[#7A0710]">
            Попробуйте ещё раз или выберите другой способ оплаты.
          </div>
          <div className="mt-1 text-[#7A0710]/80 text-[14px]">
            Сообщение закроется автоматически через 15 секунд.
          </div>
        </div>
      )}

      <p className="text-[16px] mb-4">
        Корзина не была очищена — вы можете повторить оплату после проверки
        данных.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate("/checkout")}
          className="inline-flex items-center justify-center rounded-[10px] px-6 h-[44px] bg-[#1C1A61] text-white text-[16px] font-semibold hover:bg-[#EC1822] transition"
        >
          Повторить оплату
        </button>

        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="inline-flex items-center justify-center rounded-[10px] px-6 h-[44px] border border-[#1C1A61] text-[#1C1A61] text-[16px] font-semibold hover:bg-[#1C1A61] hover:text-white transition"
        >
          Вернуться в корзину
        </button>
      </div>
    </Container>
  );
}
