import React from 'react';
import { FaQuoteLeft } from 'react-icons/fa';

const ReviewCard = ({ review }) => {
  const { userName, testimonial, user_photoURL, bookTitle } = review;

  return (
    <div className="max-w-sm bg-white shadow-lg rounded-xl p-6 border border-gray-200">
      {/* Quote Icon */}
      <FaQuoteLeft className="text-indigo-500 text-2xl mb-4" />

      {/* Testimonial */}
      <p className="mb-4 text-black">{testimonial}</p>

      <div className="border-t border-dashed border-gray-300 my-4"></div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100">
          <img
            src={user_photoURL}
            alt={userName}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-lg text-black">{userName}</h3>
          <p className="text-sm text-gray-500">
            Shared "{bookTitle}" on BookShare
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
