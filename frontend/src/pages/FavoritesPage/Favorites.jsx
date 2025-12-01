import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Container from "../../components/ui/Container";
import ProductCard from "../../components/ProductCard/ProductCard";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

// достаем категорию максимально “живуче” под разные форматы бэка
function getCategoryName(p) {
  const obj = p?.product ? p.product : p;

  // ДОБАВИЛ: если category приходит строкой
  const cat =
    typeof obj?.category === "string"
      ? obj.category
      : obj?.category?.name || obj?.category?.title;

  return (
    cat ||
    obj?.category_path ||
    obj?.categoryPath ||
    obj?.category?.name ||
    obj?.category?.title ||
    (Array.isArray(obj?.categories) ? obj.categories[0]?.name : null) ||
    "Без категории"
  );
}

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // фильтр
  const [selectedCats, setSelectedCats] = useState(new Set());
  const { authed } = useAuth();

  const reloadFavorites = async () => {
    if (!authed) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const favs = await api.getFavorites();
      const arr = Array.isArray(favs?.results)
        ? favs.results
        : Array.isArray(favs)
        ? favs
        : [];

      const normalized = arr.map((x) => (x?.product ? x.product : x));
      setFavorites(normalized);
    } catch (e) {
      console.warn("favorites load failed:", e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadFavorites();
    const onFavChanged = () => reloadFavorites();
    window.addEventListener("favorites:changed", onFavChanged);
    return () => window.removeEventListener("favorites:changed", onFavChanged);
  }, [authed]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of favorites) set.add(getCategoryName(p));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [favorites]);

  const filtered = useMemo(() => {
    if (!selectedCats.size) return favorites;
    return favorites.filter((p) => selectedCats.has(getCategoryName(p)));
  }, [favorites, selectedCats]);

  const toggleCat = (name) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const clearFilter = () => setSelectedCats(new Set());

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-24">
      {/* Хлебные крошки */}
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span>Избранное</span>
      </div>

      <h1 className="text-[42px] sm:text-[56px] font-extrabold mb-6">
        Избранное
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Левая колонка фильтров */}
        <aside className="w-full lg:w-[320px]">
          <div className="bg-[#E5E5E5] rounded-[14px] p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-extrabold">Фильтр</h2>

              {selectedCats.size > 0 && (
                <button
                  type="button"
                  onClick={clearFilter}
                  className="text-[14px] underline underline-offset-4 hover:text-[#EC1822] transition"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="text-[#1C1A61]/60 text-[14px]">Загрузка…</div>
              ) : categories.length ? (
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {categories.map((name) => {
                    const checked = selectedCats.has(name);
                    return (
                      <label
                        key={name}
                        className="flex items-center gap-3 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCat(name)}
                          className="w-4 h-4"
                        />
                        <span className="text-[16px]">{name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[#1C1A61]/60 text-[14px]">
                  Категории не найдены
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Правая часть — товары */}
        <section className="flex-1">
          {loading ? (
            <div className="text-[#1C1A61]/60 text-[16px]">Загрузка…</div>
          ) : filtered.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-4">
              {filtered.map((p) => (
                <ProductCard key={p.slug || p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-[#E5E5E5] rounded-[14px] p-8 text-center">
              <div className="text-[18px] text-[#1C1A61]/70">
                В избранном пока пусто
              </div>
              <Link
                to="/catalog"
                className="inline-block mt-4 underline underline-offset-4 hover:text-[#EC1822] transition"
              >
                Перейти в каталог
              </Link>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
