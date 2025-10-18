import { useEffect, useState } from "react";
import ProductRail from "../../ui/ProductRail";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";

export default function SaleSection({ products = [] }) {
  const [items, setItems] = useState(products);

  useEffect(() => {
    if (!USE_API) return;
    fetch(API.sale)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        setItems(arr.map(mapToCardShape));
      })
      .catch((e) => console.warn("SaleSection fetch error:", e));
  }, []);

  return <ProductRail title="Распродажа" items={items} />;
}