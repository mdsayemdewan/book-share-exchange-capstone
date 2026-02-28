import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', required: true },

    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true, unique: true, index: true },
    phone: { type: String, trim: true, required: true, unique: true, index: true },

    passwordHash: { type: String, required: true, select: false },

    location: { type: locationSchema, required: true },
    imageUrls: {
      type: [String],
      validate: {
        validator(v) {
          return Array.isArray(v) && v.length >= 1;
        },
        message: 'At least one profile image is required',
      },
      required: true,
    },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
