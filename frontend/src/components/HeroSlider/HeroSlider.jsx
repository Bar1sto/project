import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import styles from './HeroSlider.module.css';
import 'swiper/css';

const HeroSlider = () => {
  const slides = [
    {
      id: 1,
      image: "/images/slide1.png"
    },
    {
      id: 2,
      image: "/images/slide2.png"
    },
    // Добавьте другие слайды
  ];

  return (
    <div className={styles.sliderContainer}>
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 5000 }}
        loop
        className={styles.swiper}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div 
              className={styles.slide}
              style={{ 
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;