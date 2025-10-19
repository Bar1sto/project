import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../ui/Container";

function fmtPhone(raw) {
  if (!raw) return "—";
  const d = String(raw).replace(/\D/g, "");
  const x = d.padStart(11, "7").slice(0, 11).split("");
  return `+${x[0]} (${x[1]}${x[2]}${x[3]}) ${x[4]}${x[5]}${x[6]}-${x[7]}${x[8]}-${x[9]}${x[10]}`;
}

export default function Profile() {
  // демо-данные (пока без бэка)
  const [me] = useState({
    first_name: "Вадим",
    last_name: "Ропотан",
    team: "Авангард Омск",
    phone: "7777777777",
    birth_date: "01.01.2025",
    bonuses: "10 990",
    avatar: "",
  });
  const loading = false;

  const fullName = useMemo(
    () => [me?.last_name, me?.first_name].filter(Boolean).join(" "),
    [me]
  );
  const phoneDisplay = useMemo(() => fmtPhone(me?.phone), [me]);

  // ПАРАМЕТР «ступеньки» (высота зазора под фото слева)
  // Если надо больше/меньше — меняй тут и ниже в классах h-[STEP] / -top-[STEP]
  const STEP = 20; // px
  // Ширина «выреза» = ширина левой колонки (360px) + gap-x (24px = gap-6)
  const NOTCH_W = 360 + 24; // 384px

  return (
    <Container className="font-[Actay] text-[#1C1A61]">
      {/* Крошки */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span>Личный кабинет</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Личный кабинет
      </h1>

      {/* ===== Ступенька: слева ФОТО, справа ИНФО; ниже — КНОПКИ на всю ширину ===== */}
      <section className="relative mb-12">
        {/* 2 колонки / 2 строки; по вертикали без зазора на десктопе */}
        <div className="grid grid-cols-1 md:grid-cols-[360px,1fr] md:grid-rows-[auto,auto] gap-x-6 gap-y-6 md:gap-y-0">
          {/* ЛЕВО ВВЕРХУ — ФОТО */}
          {/* ЛЕВО ВВЕРХУ — ФОТО */}
          <div className="md:col-start-1 md:row-start-1 bg-[#E5E5E5] rounded-[14px] p-5 shadow-sm overflow-hidden">
            <div className="rounded-[12px] border border-[#1C1A61] bg-white/60 aspect-square flex items-center justify-center">
              {me?.avatar ? (
                <img
                  src={me.avatar}
                  alt={fullName || "Аватар"}
                  className="w-full h-full object-cover rounded-[12px]"
                />
              ) : (
                <div className="text-[#1C1A61]/70">Фото</div>
              )}
            </div>
          </div>

          {/* ПРАВО ВВЕРХУ — ИНФО */}
          <div className="md:col-start-2 md:row-start-1 bg-[#E5E5E5] rounded-t-[14px] rounded-b-none p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-7 w-2/3 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/3 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/2 bg-[#1C1A61]/10 rounded" />
                <div className="h-4 w-1/3 bg-[#1C1A61]/10 rounded" />
              </div>
            ) : (
              <>
                <h2 className="text-[28px] sm:text-[32px] font-extrabold mb-1">
                  {fullName || "—"}
                </h2>
                <p className="text-[18px] mb-6">{me?.team || "—"}</p>

                <div className="space-y-6">
                  <div>
                    <div className="text-[18px]">Номер телефона</div>
                    <div className="text-[26px] font-semibold">
                      {phoneDisplay || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[18px]">Дата рождения</div>
                    <div className="text-[26px] font-semibold">
                      {me?.birth_date || "—"}
                    </div>
                  </div>

                  <div className="flex items-end gap-5">
                    <div>
                      <div className="text-[18px]">Сумма бонусов</div>
                      <div className="text-[46px] font-extrabold leading-none">
                        {me?.bonuses ?? "0"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="self-center underline underline-offset-4 hover:text-[#EC1822] transition"
                    >
                      Подробнее…
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* НИЖЕ — КНОПКИ/МЕНЮ: во всю ширину, вплотную к инфо справа.
              «Ступенька» слева делается белым оверлеем. */}
          <div className="relative md:col-span-2 md:row-start-2 bg-[#E5E5E5] rounded-[14px] p-4 md:p-6">
            {/* Оверлей-«вырез» под фото (виден только на md+) */}
            <div
              className="hidden md:block absolute left-0 bg-white"
              style={{
                top: `-${STEP}px`, // поднимаем «вырез» над верхом блока
                height: `${STEP}px`, // высота зазора
                width: `${NOTCH_W}px`, // ширина = колонка слева + gap
              }}
            />

            {/* Сами пункты меню / кнопки */}
            <ul className="space-y-4 sm:space-y-3 text-[20px] sm:text-[22px] font-extrabold relative">
              <li className="hover:text-[#EC1822] cursor-pointer transition">
                История покупок
              </li>
              <li className="hover:text-[#EC1822] cursor-pointer transition">
                Избранные товары
              </li>
              <li className="hover:text-[#EC1822] cursor-pointer transition">
                Купить сертификат
              </li>
              <li className="hover:text-[#EC1822] cursor-pointer transition">
                Настройки
              </li>
            </ul>
          </div>
        </div>
      </section>
    </Container>
  );
}
