import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import ReviewCard from './ReviewCard';

const sampleReviews = [
  {
    id: 1,
    userName: 'Sayem',
    testimonial: 'I exchanged my old books quickly and got amazing new reads!',
    user_photoURL: '/images/user1.jpg',
    bookTitle: 'Harry Potter',
  },
  {
    id: 2,
    userName: 'Mobin',
    testimonial: 'BookShare makes it so easy to find rare books from other readers.',
    user_photoURL: '/images/user2.jpg',
    bookTitle: 'The Hobbit',
  },
  {
    id: 3,
    userName: 'Nabid',
    testimonial: 'I love sharing my books and reading others’ collections!',
    user_photoURL: '/images/user3.jpg',
    bookTitle: '1984',
  },
  {
    id: 4,
    userName: 'Mizan',
    testimonial: 'A fantastic platform to keep my book collection fresh.',
    user_photoURL: '/images/user4.jpg',
    bookTitle: 'Pride and Prejudice',
  },
];

const Reviews = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    setReviews(sampleReviews);
  }, []);

  return (
    <div className="my-24 px-4 md:px-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-black mb-4">BookShare Reviews</h3>
        <p className="text-gray-700">
          See what our users say about sharing and exchanging their books
        </p>
      </div>

      {/* Swiper Carousel */}
      {reviews.length > 0 && (
        <Swiper
          loop={true}
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={3}
          coverflowEffect={{
            rotate: 30,
            stretch: 50,
            depth: 200,
            modifier: 1,
            scale: 0.75,
            slideShadows: true,
          }}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          modules={[EffectCoverflow, Pagination, Autoplay]}
          className="mySwiper"
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id}>
              <ReviewCard review={review} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};

export default Reviews;
