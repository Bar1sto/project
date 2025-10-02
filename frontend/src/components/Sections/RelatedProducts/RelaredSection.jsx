import ProductCard from '../../ProductCard/ProductCard';
import styles from './RelaredSection.module.css';

const RelaredSection = ({ products }) => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>История просмотров</h2>
        <div className={styles.productsGrid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelaredSection;