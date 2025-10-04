import { useEffect, useState } from "react";
import ProductCard from "../../ProductCard/ProductCard";
import styles from "./SaleSection.module.css";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";

const PopularSection = ({ products }) => {
  const [items, setItems] = useState(products);

  useEffect(() => {
    if (!USE_API) return;

    fetch(API.sale)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        setItems(arr.map(mapToCardShape));
      })
      .catch((e) => console.warn("SaleSection fetch error:", e));
  }, []);
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Распродажа</h2>
        <div className={styles.productsGrid}>
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularSection;
