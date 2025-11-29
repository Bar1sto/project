import HeroSlider from "../components/HeroSlider/HeroSlider";
import PopularSection from "../components/Sections/PopularSection/PopularSection";
import NewProductsSection from "../components/Sections/NewProductsSection/NewProductsSection";
import SaleSection from "../components/Sections/SaleSection/SaleSection";

const HomePage = () => {
  return (
    <main>
      <HeroSlider />
      <PopularSection />
      <NewProductsSection />
      <SaleSection />
    </main>
  );
};

export default HomePage;
