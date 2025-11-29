import { useEffect, useState } from "react";
import ProductRail from "../../ui/ProductRail";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";
import api from "../../../lib/api";

export default function PopularSection({ products = [] }) {
  const [items, setItems] = useState(USE_API ? [] : products);

  useEffect(() => {
    if (!USE_API) return;

    (async () => {
      try {
        const r = await api._fetch(API.popular);
        const data = r.data;

        const arr = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];

        setItems(arr.map(mapToCardShape));
      } catch (e) {
        console.warn("PopularSection load error:", e);
      }
    })();
  }, []);

  return <ProductRail title="Популярные товары" items={items} />;
}
