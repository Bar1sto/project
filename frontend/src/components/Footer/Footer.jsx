import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.section}>
        <h3>Магазин №77</h3>
        <p>ул. имени М.Е. Соколова, 17, Краснодар</p>
      </div>
      <div className={styles.section}>
        {/* Здесь будет карта (добавим позже) */}
      </div>
      <div className={styles.section}>
        <h3>Контакты</h3>
        <p>+7(861) 242-72-77</p>
        <p>hockeyshop77@mail.ru</p>
      </div>
    </footer>
  );
};

export default Footer;