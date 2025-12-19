import { useEffect, useRef, useState } from "react";
import Container from "../../components/ui/Container";
import TelegramIcon from "../../assets/icons/tgicon90.svg?react";
import WhatsAppIcon from "../../assets/icons/waicon90.svg?react";

const ADDRESS = "ул. имени М.Е. Соколова, 17, Краснодар";
// Если знаешь точные координаты магазина — заполни и геокод отключится
const COORDS = [45.115097, 38.985778]; // например: [45.0360, 38.9749]
const FALLBACK_CENTER = [45.115097, 38.985778]; // центр Краснодара

function useYandexMaps() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.ymaps && window.ymaps.ready) {
      window.ymaps.ready(() => setReady(true));
      return;
    }
    const id = "ymaps-api";
    if (document.getElementById(id)) {
      const check = setInterval(() => {
        if (window.ymaps && window.ymaps.ready) {
          clearInterval(check);
          window.ymaps.ready(() => setReady(true));
        }
      }, 100);
      return () => clearInterval(check);
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.standard";
    s.async = true;
    s.onload = () => window.ymaps.ready(() => setReady(true));
    s.onerror = () => console.warn("Yandex Maps failed to load");
    document.head.appendChild(s);
  }, []);

  return ready;
}

function YandexMap({ address = ADDRESS, coords = COORDS }) {
  const ready = useYandexMaps();
  const boxRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!ready || !boxRef.current) return;
    const ymaps = window.ymaps;

    mapRef.current = new ymaps.Map(boxRef.current, {
      center: coords || FALLBACK_CENTER,
      zoom: coords ? 16 : 15,
      controls: ["zoomControl"],
    });

    const addPlacemark = (point) => {
      const placemark = new ymaps.Placemark(
        point,
        {
          hintContent: address,
          balloonContent: address,
          // подпись прямо рядом с меткой:
          iconCaption: address,
        },
        {
          preset: "islands#redIcon",
        }
      );
      mapRef.current.geoObjects.add(placemark);
      mapRef.current.setCenter(point, 17);
      // Если нужно сразу показать балун — раскомментируй:
      // placemark.balloon.open();
    };

    if (coords) {
      addPlacemark(coords);
    } else {
      ymaps
        .geocode(address, { results: 1 })
        .then((res) => {
          const first = res.geoObjects.get(0);
          if (!first) return;
          addPlacemark(first.geometry.getCoordinates());
        })
        .catch(() => {
          // остаёмся на FALLBACK_CENTER без метки
        });
    }

    return () => {
      if (mapRef.current && mapRef.current.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [ready, address, coords]);

  // Соотношение 4:3
  return (
    <div className="relative w-full rounded-[10px] overflow-hidden border-2 border-[#1C1A61]">
      <div className="pt-[75%]" />
      <div ref={boxRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

export default function Footer() {
  const PHONE_1_VIEW = "+7 (988) 243-72-77";
  const PHONE_2_VIEW = "+7 (861) 242-72-77";
  const PHONE_1_TEL = "+79882437277";
  const PHONE_2_TEL = "+78612427277";
  const PHONE_CHAT = "79882437277"; // для wa.me и tg
  const EMAIL = "hockeyshop77@mail.ru";

  const openTelegram = () => {
    const native = `tg://resolve?phone=${PHONE_CHAT}`;
    const web = `https://t.me/+${PHONE_CHAT}`;
    const w = window.open(native, "_blank");
    setTimeout(() => {
      // если native не открылся — откроем web
      window.open(web, "_blank");
    }, 300);
  };

  return (
    <footer className="bg-[#E5E5E5] text-[#1C1A61] font-[Actay]">
      <Container size="wide" gutter="sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-8">
          {/* Левая колонка */}
          <div className="px-2">
            <h3 className="text-xl font-extrabold mb-2">Магазин №77</h3>
            <p className="leading-relaxed">{ADDRESS}</p>
          </div>

          {/* Центр — карта 4:3 */}
          <div className="px-2">
            <YandexMap />
          </div>

          {/* Правая колонка — контакты + мессенджеры */}
          <div className="px-2">
            <h3 className="text-xl font-bold mb-1">Контакты</h3>

            <div className="space-y-1">
              <a
                href={`tel:${PHONE_1_TEL}`}
                className="block font hover:text-[#EC1822] transition-colors"
              >
                {PHONE_1_VIEW}
              </a>
              <a
                href={`tel:${PHONE_2_TEL}`}
                className="block font hover:text-[#EC1822] transition-colors"
              >
                {PHONE_2_VIEW}
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="block hover:text-[#EC1822] font transition-colors"
              >
                {EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={`https://wa.me/${PHONE_CHAT}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Написать в WhatsApp"
                className="inline-flex items-center hover:scale-110"
                title="WhatsApp"
              >
                <WhatsAppIcon
                  className="w-7 h-7
                    transition-colors
                    
                    "
                />
              </a>

              <a
                href={`https://t.me/${PHONE_CHAT.replace("+", "")}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Написать в Telegram"
                className="inline-flex items-center hover:scale-110"
                title="Telegram"
              >
                <TelegramIcon
                  className="w-7 h-7
                    transition-colors
                    hover:text-[#EC1822] 
                    fill-[none]
                    "
                />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
