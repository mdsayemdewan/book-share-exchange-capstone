import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import bannerImg1 from '../../../assets/banner/banner1.jpg';
import bannerImg2 from '../../../assets/banner/banner2.jpg';
import bannerImg3 from '../../../assets/banner/banner3.jpg';
const Banner = () => {
    return (
            <Carousel
            autoPlay={true}
            infiniteLoop={true}
        >
            <div>
                <img src={bannerImg1} className="h-full  w-full object-cover" />
            </div>
            <div>
                <img src={bannerImg2} className="h-full w-full object-cover"/>
            </div>
            <div>
                <img src={bannerImg3} className="h-full  w-full object-cover"/>
            </div>
        </Carousel>
    );
};

export default Banner;