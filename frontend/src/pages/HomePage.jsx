import HeroSlider from '../components/HeroSlider/HeroSlider';
import PopularSection from '../components/Sections/PopularSection/PopularSection';
import NewProductsSection from '../components/Sections/NewProductsSection/NewProductsSection';
import SaleSection from '../components/Sections/SaleSection/SaleSection';

const HomePage = () => {
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
    {
      id: 4,
      name: "Перчатки",
      brand: "BAUER X",
      type: "S21 SR",
      price: "7 990",
      isHit: false,
      image: "/images/pr.png"
    },
    {
      id: 5,
      name: "Трусы игрока",
      brand: "CCM",
      type: "ASS80 JR",
      price: "22 990",
      isHit: true,
      image: "/images/pr.png"
    },
    {
      id: 6,
      name: "Шлем",
      brand: "CCM",
      type: "FL500",
      price: "12 990",
      isHit: false,
      image: "/images/pr.png"
    },
    {
      id: 7,
      name: "Коньки",
      brand: "BAUER",
      type: "VAPOR X5",
      price: "24 990",
      isHit: true,
      image: "/images/pr.png"
    }
  
  ];
  return (
    <>
      <main>
        <HeroSlider />
        <PopularSection products={popularProducts} />
        <NewProductsSection products={popularProducts} />
        <SaleSection products={popularProducts} />
      </main>
    </>
  );
};

export default HomePage;