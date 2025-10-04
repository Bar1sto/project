import { useState } from 'react';
import styles from './ProductCard.module.css';
import heartIcon from '../../assets/heart-icon.png';
import heartIconRed from '../../assets/heart-red-icon.png'; 

const ProductCard = ({ product }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageContainer}>
        <img 
          src={product.image} 
          alt={product.name} 
          className={styles.productImage}
        />
      </div>
      
      <div className={`${styles.productInfo} ${isHovered ? styles.hovered : ''}`}>
        <p className={styles.hitBadge}>ХИТ</p>
        <p className={styles.productBrand}>{product.brand}</p>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productPrice}>{product.price.toLocaleString('ru-RU')}</p>
        
        <div className={styles.actions}>
        <button className={styles.cartButton}>В корзину</button>
          <button 
            className={styles.favoriteButton}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <img 
              src={isFavorite ? heartIconRed : heartIcon} 
              alt="Избранное" 
            />
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default ProductCard;