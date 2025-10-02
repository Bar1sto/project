import { use, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Cart.module.css';
import iconCart from '../../assets/корзина.svg';

const Cart = () => {
const [promoCode, setPromoCode] = useState('');
const [bonuses, setBonuses] = useState('');

    return (
        <div className={styles.mainContainer}>
            <h2 className={styles.title}>Корзина</h2>
            {/* Хлебные крошки */}
            <div className={styles.breadcrumbs}>
                <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
                <span className={styles.breadcrumbSeparator}> / </span>
                <span className={styles.breadcrumbCurrent}>Корзина</span>
            </div>
            <div className={styles.cartContainer}>
                <div className={styles.cartBody}>
                    <div className={styles.cartItem}>
                        <img src={iconCart}
                            alt='Иконка корзины'
                            className={styles.iconCart}
                        >
                        </img>
                    </div>
                    <div className={styles.bonusBody}>
                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>
                                Введите промокод
                            </label>
                            <div clasaName={styles.inputWrapper}>
                                <input 
                                type="text" 
                                value={promoCode} 
                                onChange={(e) => setPromoCode(e.target.value)}
                                className={styles.inputField}
                                placeholder="Промокод"
                                >
                                </input>
                                <button className={styles.applyButton}>
                                    Готово
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Списать бонусы</label>
                            <div className={styles.inputWrapper}>
                                <input  
                                    type="text"
                                    value={bonuses}
                                    onChange={(e) => setBonuses(e.target.value)}
                                    className={styles.inputField}
                                    placeholder="0"
                                />
                                <button className={styles.applyButton}>
                                    Готово
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.resultBody}>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;