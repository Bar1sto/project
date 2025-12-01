import { useEffect, useState } from "react";
import ProductRail from "../../ui/ProductRail";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";
import api from "../../../lib/api";

export default function NewProductsSection({ products = [] }) {
  const [items, setItems] = useState(USE_API ? [] : products);

  useEffect(() => {
    if (!USE_API) return;

    (async () => {
      try {
        const r = await api._fetch(API.fresh);
        const data = r.data;

        const arr = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        setItems(arr.map(mapToCardShape));
        const cards = arr.map(mapToCardShape).filter((p) => p.isNew);
        setItems(cards);
      } catch (e) {
        console.warn("NewProductsSection load error:", e);
      }
    })();
  }, []);

  return <ProductRail title="Новинки" items={items} />;
}
