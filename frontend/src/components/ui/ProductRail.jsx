import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "../../components/ProductCard/ProductCard"; // твоя карточка
import Container from "../ui/Container";

export default function ProductRail({
  title = "",
  items = [],
  // Если хочешь особый рендер — передай renderItem. По умолчанию — твой ProductCard.
  renderItem,
}) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // следим за доступностью стрелок
  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 0);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    const onResize = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [items?.length]);

  const pageScroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = el.clientWidth; // прокрутка на ширину видимой области
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="py-6">
      <Container size="wide">
        {/* заголовок + стрелки справа */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-[clamp(55px,2vw,36px)] font-bold text-[#1C1A61]">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => pageScroll(-1)}
              disabled={!canPrev}
              className={`w-10 h-10 rounded-lg border transition
                ${canPrev ? "border-[#1C1A61] text-[#1C1A61] hover:border-[#EC1822] hover:text-[#EC1822]" : "border-black/10 text-black/30 cursor-not-allowed"}`}
              aria-label="Назад"
            >
              <svg viewBox="0 0 24 24" className="mx-auto w-5 h-5" fill="none">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => pageScroll(1)}
              disabled={!canNext}
              className={`w-10 h-10 rounded-lg border transition
                ${canNext ? "border-[#1C1A61] text-[#1C1A61] hover:border-[#EC1822] hover:text-[#EC1822]" : "border-black/10 text-black/30 cursor-not-allowed"}`}
              aria-label="Вперёд"
            >
              <svg viewBox="0 0 24 24" className="mx-auto w-5 h-5" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* трек — одна строка, свайп/скролл, снап по карточкам */}
        <div
          ref={trackRef}
          className="
            relative -mx-2 px-2
            overflow-x-auto scroll-smooth
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
            touch-pan-x
            snap-x snap-mandatory
          "
        >
          <div className="flex gap-4">
            {items?.map((it, i) => (
              <div key={it?.id ?? i} className="snap-start shrink-0">
                {renderItem ? (
                  renderItem(it)
                ) : (
                  // твоя карточка уже фиксированной ширины 250px и высоты 500px
                  <ProductCard product={it} />
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}