import { useState } from 'react';
import heartIcon from '../../assets/heart-icon.png';
import { Link } from 'react-router-dom';
import heartRedIcon from '../../assets/heart-red-icon.png';
import styles from './BigProductCard.module.css';
import RelaredSection from '../Sections/RelatedProducts/RelaredSection';



const BigProductCard = () => {
    const [isFavorite, setIsFavorite] = useState(false);
    const popularProducts = [
        {
          id: 1,
          name: "Налокотники игрока",
          brand: "BAUER S22 VAPOR",
          type: "HYPERLITE INT",
          price: "10 990",
          isHit: true,
          image: "/images/tovar1.png"
        },
        {
          id: 2,
          name: "Клюшка флорбольная",
          brand: "ACITO BETA",
          type: "White 35 95 Round",
          price: "18 990",
          isHit: false,
          image: "/images/pr.png"
        },
        {
          id: 3,
          name: "Перчатки",
          brand: "FISCHER",
          type: "CT150 JR",
          price: "1 990",
          isHit: true,
          image: "/images/pr.png"
        },      
      ];
    return (
        <div className={styles.mainContainer}>
            {/* Хлебные крошки */}
            <div className={styles.breadcrumbs}>
                <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
                <span className={styles.breadcrumbSeparator}> / </span>
                <Link to="/category" className={styles.breadcrumbLink}>Наименование секции</Link>
                <span className={styles.breadcrumbSeparator}> / </span>
                <span className={styles.breadcrumbCurrent}>Наименование товара</span>
            </div>

            {/* Основной блок с товаром */}
            <div className={styles.productContainer}>
                {/* Блок с фото товара */}
                <div className={styles.productImageContainer}>
                    <div className={styles.imageWrapper}>
                        <img
                            src="./././images/tovar1.png"
                            alt="Фото товара"
                            className={styles.productImage}
                        />
                    </div>
                </div>
            
                <div className={styles.productInfo}>
                    {/* Название товара */}
                    <h1 className={styles.productTitle}>Налокотники игрока <span>BAUER S22 VAPOR HYPERLITE INT</span></h1>
                    {/* Артикул и наличие */}
                    <div className={styles.productMeta}>
                        <p className={styles.productCode}>Арт. 123456789</p>
                        <p className={styles.productAvailability}>В наличии</p>
                    </div>

                    {/* Выбор размера */}
                    <div className={styles.sizeSection}>
                        <p className={styles.sectionTitle}>Выберите размер</p>
                        <div className={styles.sizeOptions}>
                            {['S', 'M', 'L', 'XL'].map(size => (
                                <label key={size} className={styles.sizeOption}>
                                    <input
                                        type="radio"
                                        name="size"
                                        value={size}
                                        className={styles.sizeInput}
                                    />
                                    <span className={styles.sizeLabel}>{size}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Цена и кнопки */}
                    <div className={styles.priceSection}>
                        <p className={styles.productPrice}>10 990</p>
                        <div className={styles.actionButtons}>
                            <button className={styles.cartButton}>В корзину</button>
                            <button
                                className={styles.favoriteButton}
                                onClick={() => setIsFavorite(!isFavorite)}
                            >
                                <img
                                    src={isFavorite ? heartRedIcon : heartIcon}
                                    alt={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Блок с описанием товара */}
            <div className={styles.descriptionBlock}>
                <h3 className={styles.descriptionTitle}>Описание</h3>
                <div className={styles.descriptionText}>
                    <p>Налокотники BAUER S22 VAPOR HYPERLITE INT разработаны для профессиональных хоккеистов.
                        Модель сочетает максимальную защиту и мобильность. Анатомическая форма обеспечивает
                        идеальную посадку, а инновационные материалы гарантируют долговечность.</p>

                    <p>Особенности:
                        <ul>
                            <li>Защита локтя и предплечья</li>
                            <li>Дышащие вставки для вентиляции</li>
                            <li>Усиленные ударопрочные элементы</li>
                            <li>Система быстрой фиксации</li>
                        </ul>
                    </p>
                </div>
            </div>

            {/* Блок с похожими товарами */}
            <div className={styles.relatedProducts}>
                {/* Здесь будут карточки похожих товаров */}
                <RelaredSection products={popularProducts} />
            </div>
        </div >
    );
};

export default BigProductCard;