import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Container from "../ui/Container";
import "swiper/css";

export default function HeroSlider() {
  const slides = [
    { id: 1, image: "/images/slide1.png", alt: "Слайд 1" },
    { id: 2, image: "/images/slide2.png", alt: "Слайд 2" },
  ];

  return (
    <section className="py-6">
      <Container size="wide">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          className="
            h-[260px] sm:h-[320px] md:h-[400px] lg:h-[460px] xl:h-[520px]
            rounded-[28px] overflow-hidden border-2 border-[#1C1A61]
          "
        >
          {slides.map((s) => (
            <SwiperSlide key={s.id}>
              <img
                src={s.image}
                alt={s.alt}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
}