// Универсальный контейнер: одинаковые боковые отступы + адаптивная max-width.
// size: "default" | "wide" | "narrow" | "bleed" (bleed = во всю ширину, но с паддингом)

// src/components/ui/Container.jsx
const SIZE = {
  page: "max-w-[1200px]",   // выбери свою цифру под макет
  wide: "max-w-[1360px]",
  full: "max-w-none",
};

const GUTTER = {
  none: "px-0",
  sm:   "px-4",             // ~16px
  md:   "px-6",             // ~24px
  lg:   "px-8",             // ~32px
};

export default function Container({
  children,
  size = "page",
  gutter = "md",
  className = "",
}) {
  return (
    <div className={`mx-auto w-full ${SIZE[size]} ${GUTTER[gutter]} ${className}`}>
      {children}
    </div>
  );
}
