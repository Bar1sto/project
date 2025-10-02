import styles from './AuthForm.module.css';

const AuthForm = ({ isAuth, setIsAuth }) => {
    return (
        <div className={styles.authForm}>
            <h2>{isAuth ? 'Авторизация' : 'Регистрация'}</h2>

            {!isAuth && (
                <form className={styles.form}>
                    <input type="tel" placeholder="Номер телефона" required />
                    <input type="password" placeholder="Пароль" required />
                    <button type="submit" className={styles.submitButton}>Готово</button>
                </form>
            )}

            <div className={styles.switchMode}>
                
            </div>
        </div>
    )
}