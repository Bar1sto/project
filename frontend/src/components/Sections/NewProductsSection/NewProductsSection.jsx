import { useEffect, useState } from "react";
import ProductCard from "../../ProductCard/ProductCard";
import styles from "./NewProductsSection.module.css";
import { USE_API, API, mapToCardShape } from "../../../utils/dataSource";

const PopularSection = ({ products }) => {
  const [items, setItems] = useState(products);

  useEffect(() => {
    if (!USE_API) return;

    fetch(API.fresh)
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
          ? data
          : [];
        setItems(arr.map(mapToCardShape));
      })
      .catch((e) => console.warn("NewProductsSection fetch error:", e));
  }, []);
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Новинки</h2>
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
