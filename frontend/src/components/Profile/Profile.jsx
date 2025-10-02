import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Profile.module.css';
import RelaredSection from '../Sections/RelatedProducts/RelaredSection';



const Profile = () => {
    const [activeMenu, setActiveMenu] = useState(null);
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

    const handleMenuClick = (menu) => {
        if (menu === 'settings') return; // Настройки не реагируют
        setActiveMenu(activeMenu === menu ? null : menu);
    };
    return (
        <div className={styles.profileContainer}>
            {/* Хлебные крошки */}
            <div className={styles.breadcrumbs}>
                <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
                <span className={styles.breadcrumbSeparator}> / </span>
                <Link to="/category" className={styles.breadcrumbLink}>Личный кабинет</Link>
            </div>

            {/* Основной блок профиля */}
            <div className={styles.profileContent}>
                {/* Блок с аватаром */}
                <div className={styles.avatarBlock}>
                    <div className={styles.avatarWrapper}>
                        <img
                            src="./././images/vadim.png"
                            alt="Фото профиля"
                            className={styles.avatarImage}
                        />
                    </div>
                </div>

                {/* Информация о профиле */}
                <div className={styles.infoBlock}>
                    <h1 className={styles.userName}>Ропотан Вадим</h1>
                    <p className={styles.userTeam}>Авангард Омск</p>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Номер телефона</span>
                        <h2 className={styles.infoValue}>+7(777) 777-77-77</h2>
                    </div>

                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Дата рождения</span>
                        <h2 className={styles.infoValue}>01.01.2025</h2>
                    </div>

                    <div className={styles.bonusRow}>
                        <span className={styles.infoLabel}>Сумма бонусов</span>
                        <div className={styles.bonusContainer}>
                            <span className={styles.bonusAmount}>10 990</span>
                            <button className={styles.detailsButton}>Подробнее...</button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Новое меню профиля */}
            <div className={styles.profileMenu}>
                <div
                    className={`${styles.menuItem} ${activeMenu === 'history' ? styles.active : ''}`}
                    onClick={() => handleMenuClick('history')}
                >
                    История покупок
                    {activeMenu === 'history' && (
                        <div className={styles.menuContent}>
                            <p>Список ваших последних заказов появится здесь</p>
                        </div>
                    )}
                </div>

                <div
                    className={`${styles.menuItem} ${activeMenu === 'favorites' ? styles.active : ''}`}
                    onClick={() => handleMenuClick('favorites')}
                >
                    Избранные товары
                    {activeMenu === 'favorites' && (
                        <div className={styles.menuContent}>
                            <p>Ваши сохраненные товары будут отображаться здесь</p>
                        </div>
                    )}
                </div>

                <div
                    className={`${styles.menuItem} ${activeMenu === 'certificate' ? styles.active : ''}`}
                    onClick={() => handleMenuClick('certificate')}
                >
                    Купить сертификат
                    {activeMenu === 'certificate' && (
                        <div className={styles.menuContent}>
                            <p>Форма покупки сертификата</p>
                        </div>
                    )}
                </div>

                <div className={styles.menuItem}>
                    Настройки
                </div>
            </div>

            {/* Блок с похожими товарами */}
            <div className={styles.relatedProducts}>
                <RelaredSection products={popularProducts} />
            </div>
        </div>
    );
};

export default Profile;