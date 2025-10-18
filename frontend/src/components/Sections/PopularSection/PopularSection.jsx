import { useEffect, useState } from "react";
import ProductRail from "../../ui/ProductRail";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";

export default function PopularSection({ products = [] }) {
  const [items, setItems] = useState(products);

  useEffect(() => {
    if (!USE_API) return;
    fetch(API.popular)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setItems(arr.map(mapToCardShape));
      })
      .catch((e) => console.warn("PopularSection fetch error:", e));
  }, []);

  return <ProductRail title="Популярные товары" items={items} />;
}