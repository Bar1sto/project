import { useEffect, useState } from "react";
import ProductCard from "../../ProductCard/ProductCard";
import styles from "./PopularSection.module.css";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";

const PopularSection = ({ products }) => {
  const [items, setItems] = useState(products);

  useEffect(() => {
    if (!USE_API) return; // если флаг выключен — оставляем статику из props

    fetch(API.popular)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        setItems(arr.map(mapToCardShape));
      })
      .catch((e) => console.warn("PopularSection fetch error:", e));
  }, []);
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Популярные товары</h2>
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
