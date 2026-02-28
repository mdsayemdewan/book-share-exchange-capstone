import mongoose from 'mongoose';

const exchangeOfferSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookName: { type: String, required: true, trim: true },
    condition: { type: String, enum: ['new', 'good', 'used'], required: true },
    category: { type: String, required: true, trim: true },
    locationText: { type: String, required: true, trim: true },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    wantedBook: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('ExchangeOffer', exchangeOfferSchema);
