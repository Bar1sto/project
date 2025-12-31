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
        {/* Было .sliderContainer */}
        <div className="w-[calc(100%-110px)] h-[400px] my-[40px] mx-auto">
          <Swiper
            modules={[Autoplay]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop
            /* Было .swiper */
            className="h-full w-full rounded-[50px] overflow-hidden border-[3px] border-[#1C1A61] box-border"
          >
            {slides.map((s) => (
              <SwiperSlide key={s.id} className="h-full w-full">
                <img
                  src={s.image}
                  alt={s.alt}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </section>
  );
}
