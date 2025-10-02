import styles from './RegisterForm.module.css';

const RegisterForm = ({ isLogin, setIsLogin }) => {
  return (
    <div className={styles.authForm}>
      <h2>{isLogin ? 'Авторизация' : 'Регистрация'}</h2>
      
      {!isLogin && (
        <form className={styles.form}>
          <input type="text" placeholder="Фамилия" required />
          <input type="text" placeholder="Имя" required />
          <input type="tel" placeholder="Номер телефона" required />
          <input type="password" placeholder="Пароль" required />
          <input type="password" placeholder="Еще раз пароль" required />
          <button type="submit" className={styles.submitButton}>Готово</button>
        </form>
      )}

      {isLogin && (
        <form className={styles.form}>
          <input type="tel" placeholder="Номер телефона" required />
          <input type="password" placeholder="Пароль" required />
          <button type="submit" className={styles.submitButton}>Войти</button>
        </form>
      )}

      <div className={styles.switchMode}>
        {isLogin ? 'Еще нет аккаунта? ' : 'Уже есть аккаунт? '}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className={styles.switchButton}
        >
          {isLogin ? 'Регистрация' : 'Авторизация'}
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;