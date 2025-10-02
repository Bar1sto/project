import { Link } from 'react-router-dom';
import styles from './Favorites.module.css';
import ProductCard from '../../components/ProductCard/ProductCard';

const Favorites = () => {
    // Пример данных (в реальном приложении будем брать из хранилища)
    const favoriteProducts = [
        {
            id: 1,
            name: "Клюшка флорбольная",
            brand: "АСПО ВЕТА",
            type: "White 35 95 Round",
            price: "18 990",
            image: "/images/pr.png",
            isHit: true
        },
        {
            id: 2,
            name: "Перчатки FISCHER",
            brand: "CT150 JR",
            price: "1 990",
            image: "/images/pr.png"
        },
        // ... другие товары
    ];

    return (
        <div className={styles.favoritesContainer}>
            {/* Хлебные крошки */}
            <div className={styles.breadcrumbs}>
                <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
                <span className={styles.breadcrumbSeparator}> / </span>
                <span className={styles.breadcrumbCurrent}>Избранные</span>
            </div>

            {/* Заголовок */}
            <h1 className={styles.pageTitle}>Избранные</h1>

            {/* Основной контент */}
            <div className={styles.contentWrapper}>
                {/* Блок фильтров (левая колонка) */}
                <aside className={styles.filtersSidebar}>
                    <h3 className={styles.filtersTitle}>Фильтры</h3>
                    {/* Здесь будут компоненты фильтров */}
                    <div className={styles.filterSection}>
                        <h4>Категории</h4>
                        {/* ... */}
                    </div>
                </aside>

                {/* Блок товаров */}
                <section className={styles.productsSection}>
                    {favoriteProducts.length > 0 ? (
                        <div className={styles.productsGrid}>
                            {favoriteProducts.map(product => (
                                <ProductCard 
                                    key={product.id}
                                    product={product}
                                    isFavorite={true} // Все товары в избранном
                                />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <p>В избранном пока нет товаров</p>
                            <Link to="/" className={styles.catalogLink}>
                                Перейти в каталог
                            </Link>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Favorites;