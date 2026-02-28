import mongoose from 'mongoose';

const shareBookSchema = new mongoose.Schema(
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
    imageUrls: { type: [String], default: [] },
    borrowDuration: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['available', 'borrowed', 'returned'],
      default: 'available',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ShareBook', shareBookSchema);
