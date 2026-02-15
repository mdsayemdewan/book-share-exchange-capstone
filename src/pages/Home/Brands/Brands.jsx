import React from 'react';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import rokomari from '../../../assets/brands/rokomari.png';
import bookshopbd from '../../../assets/brands/bookshopbd.png';
import pbs from '../../../assets/brands/pbs.png';
import { Autoplay } from 'swiper/modules';
const brandLogos = [rokomari, bookshopbd, pbs];

const Brands = () => {
    return (

        <div className="my-10 text-center bg-gray-100 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl md:text-3xl text-black font-bold mb-6">
                Trusted By These Brands
            </h2>
            <p className="text-sm text-black mb-4">
                Our platform is supported by well-known companies
            </p>

            <Swiper
                loop={true}
                slidesPerView={4}
                centeredSlides={true}
                spaceBetween={30}
                grabCursor={true}
                modules={[Autoplay]}
                autoplay={{
                    delay: 1000,
                    disableOnInteraction: false,
                }}
            >
                {brandLogos.map((logo, index) => (
                    <SwiperSlide key={index}>
                        <div className="rounded-3xl flex items-center justify-center ">
              <img src={logo} alt="" className="h-24 w-24 object-contain" />
            </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default Brands;