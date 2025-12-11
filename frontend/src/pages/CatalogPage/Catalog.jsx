import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Container from "../../components/ui/Container";
import ProductCard from "../../components/ProductCard/ProductCard";
import api from "../../lib/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function uniqSorted(arr) {
  const set = new Set(arr.filter(Boolean).map(String));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
}

export default function CatalogPage() {
  const q = useQuery();
  const navigate = useNavigate();

  const category = q.get("category") || "";
  const group = q.get("group") || "";

  const [products, setProducts] = useState([]);
  const [sizesSelected, setSizesSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sizesAvailable = useMemo(() => {
    const all = [];
    for (const p of products) {
      if (Array.isArray(p?.sizes)) all.push(...p.sizes);
    }
    return uniqSorted(all);
  }, [products]);

  useEffect(() => {
    setSizesSelected(new Set());
  }, [category, group]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (group) params.group = group;
        if (category) params.category = category;
        if (sizesSelected.size)
          params.sizes = Array.from(sizesSelected).join(",");
        const res = await api.getProducts(params);
        const arr = Array.isArray(res?.results)
          ? res.results
          : Array.isArray(res)
          ? res
          : [];
        setProducts(arr);
      } catch {
        setProducts([]);
        setError("Не удалось загрузить каталог");
      } finally {
        setLoading(false);
      }
    })();
  }, [category, group, sizesSelected]);

  const toggleSize = (s) => {
    setSizesSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const clearSizes = () => setSizesSelected(new Set());

  return (
    <Container className="font-[Actay] text-[#1C1A61] pb-[64px]">
      <div className="mb-6 text-[15px]">
        <Link to="/" className="hover:text-[#EC1822] transition">
          Главная
        </Link>
        <span className="px-2">›</span>
        <span
          className="hover:text-[#EC1822] transition cursor-pointer"
          onClick={() => navigate("/catalog")}
        >
          Каталог
        </span>
        {category ? (
          <>
            <span className="px-2">›</span>
            <span>{category}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[42px] sm:text-[56px] font-extrabold leading-none">
          {category ? category : "Каталог"}
        </h1>

        {sizesSelected.size ? (
          <button
            type="button"
            onClick={clearSizes}
            className="text-[14px] underline underline-offset-4 hover:text-[#EC1822] transition"
          >
            Сбросить размеры
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Фильтры */}
        <aside className="bg-[#E5E5E5] rounded-[18px] p-[18px] h-fit">
          <div className="text-[18px] font-extrabold">Фильтр по размеру</div>

          <div className="mt-4">
            {loading ? (
              <div className="text-[#1C1A61]/60 text-[14px]">Загрузка…</div>
            ) : sizesAvailable.length ? (
              <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                {sizesAvailable.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={sizesSelected.has(s)}
                      onChange={() => toggleSize(s)}
                      className="w-4 h-4 accent-[#1C1A61]"
                    />
                    <span className="text-[16px]">{s}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-[#1C1A61]/60 text-[14px]">
                Нет доступных размеров для фильтра
              </div>
            )}
          </div>
        </aside>

        {/* Товары */}
        <section>
          {error ? <div className="text-[#EC1822]">{error}</div> : null}
          {loading ? <div className="text-[#1C1A61]/60">Загрузка…</div> : null}

          {!loading && !products.length ? (
            <div className="bg-[#E5E5E5] rounded-[18px] p-[26px]">
              <div className="text-[18px] font-extrabold">
                Товары не найдены
              </div>
              <div className="mt-2 text-[#1C1A61]/70">
                Попробуй снять фильтры или выбрать другую категорию.
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-4">
              {products.map((p) => (
                <ProductCard key={p.id || p.slug} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}
