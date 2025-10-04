import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../../assets/logo.png';
import iconSearch from '../../assets/search.svg';
import iconUser from '../../assets/user.svg';
import iconUserActive from '../../assets/user-red-icon.png';
import iconHeart from '../../assets/heart-icon.png';
import iconCart from '../../assets/cart-icon.png';

const Header = () => {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const catalogData = [
    {
      title: "Игрок",
      items: ["Клюшки", "Коньки", "Шлема", "Текстиль", "Сумки", "Щитки", "Трусы", "Перчатки", "Налокотники", "Нагрудники", "Набор экипировки"]
    },
    {
      title: "Вратарь",
      items: ["Клюшки", "Коньки", "Шлема", "Текстиль", "Сумки", "Блокер", "Блокер+ловушка", "Ловушка", "Нагрудник", "Трусы", "Щитки"]
    },
    {
      title: "Фигурное катание",
      items: ["Коньки", "Одежда"]
    },
    {
      title: "Флорбол",
      items: ["Клюшки", "Аксессуары"]
    },
    {
      title: "Тренировка",
      items: ["Ворота", "Мячи", "Искусственный лед", "Тренировочный инвентарь"]
    },
    {
      title: "Аксессуары",
      items: ["Бутылки", "Доски тактические", "Коврики", "Медицинские средства", "Мячи", "Наклейки", "Шайбы", "Сувениры"]
    }
  ];

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search for:', searchQuery);
    // Здесь будет логика поиска
  };

  return (
    <header className={styles.header}>
      {isSearchOpen ? (
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск товаров..."
            autoFocus
            className={styles.searchInput}
          />
          <button
            type="button"
            onClick={handleSearchClose}
            className={styles.closeSearchButton}
          >
            ×
          </button>
        </form>
      ) : (
        <>
          <div className={styles.logoContainer}>
            <img src={logo} alt='Хоккейный магазин' className={styles.logoImage} />
          </div>

          <nav className={styles.nav}>
            <div
              className={styles.navItem}
              onMouseEnter={() => setIsCatalogOpen(true)}
              onMouseLeave={() => setIsCatalogOpen(false)}
            >
              <a href="/" className={styles.link}>Каталог</a>

              {isCatalogOpen && (
                <div className={styles.catalogDropdown}>
                  <div className={styles.dropdownContent}>
                    {catalogData.map((category, index) => (
                      <div key={index} className={styles.categoryColumn}>
                        <h3 className={styles.categoryTitle}>{category.title}</h3>
                        <ul className={styles.categoryList}>
                          {category.items.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              <a href={`/`}>
                                {item}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.navItem}>
              <a href="/attributes" className={styles.link}>Атрибутика</a>
            </div>

            <div className={styles.navItem}>
              <a href="/contacts" className={styles.link}>Контакты</a>
            </div>
          </nav>

          <div className={styles.icons}>
            <button
              type="button"
              onClick={handleSearchClick}
              className={styles.iconButton}
            >
              <img
                src={iconSearch}
                alt="Поиск"
                className={styles.icon}
              />
            </button>

            <Link
              to="/register"
              className={styles.iconButton}
            >
              <img
                src={location.pathname === '/auth' ? iconUserActive : iconUser}
                alt='Профиль'
              />
            </Link>

            <Link
              to="/favorites"
              className={styles.iconButton}
            >
              <img src={iconHeart} alt='Избранное' />
            </Link>

            <button
              type="button"
              onClick={() => console.log('Cart clicked')}
              className={styles.iconButton}
            >
              <img src={iconCart} alt='Корзина' />
            </button>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;