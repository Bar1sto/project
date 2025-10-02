import ProductCard from '../../ProductCard/ProductCard';
import styles from './PopularSection.module.css';

const PopularSection = ({ products }) => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Популярные товары</h2>
        <div className={styles.productsGrid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularSection;