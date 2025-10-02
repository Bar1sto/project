import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className={styles.authPage}>
      {/* Хлебные крошки */}
      <div className={styles.breadcrumbs}>
        <Link to="/" className={styles.breadcrumbLink}>Главная</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Личный кабинет</span>
      </div>

      {/* Контейнер формы */}
      <div className={styles.authContainer}>
        <h1 className={styles.authTitle}>
          {isLogin ? 'Авторизация' : 'Регистрация'}
        </h1>
        
        {/* Общая форма с условием */}
        <form className={styles.authForm}>
          {!isLogin && (
            <>
              <div className={styles.inputGroup}>
                <input 
                  type="text" 
                  placeholder="Фамилия"
                  className={styles.authInput}
                  required
                />
              </div>
              
              <div className={styles.inputGroup}>
                <input 
                  type="text" 
                  placeholder="Имя"
                  className={styles.authInput}
                  required
                />
              </div>
            </>
          )}
          
          <div className={styles.inputGroup}>
            <input 
              type="tel" 
              placeholder="Номер телефона"
              className={styles.authInput}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <input 
              type="password" 
              placeholder="Пароль"
              className={styles.authInput}
              required
            />
          </div>
          
          {!isLogin && (
            <div className={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="Еще раз пароль"
                className={styles.authInput}
                required
              />
            </div>
          )}
          
          <button type="submit" className={styles.submitButton}>
            {isLogin ? 'Войти' : 'Готово'}
          </button>
        </form>

        {/* Переключатель между формами */}
        <div className={styles.authSwitch}>
          {isLogin ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className={styles.authSwitchText}
            type="button"
          >
            {isLogin ? 'Регистрация' : 'Авторизация'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;