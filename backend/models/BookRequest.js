import mongoose from 'mongoose';

const bookRequestSchema = new mongoose.Schema(
  {
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, required: true },
    notes: { type: String, trim: true, default: '' },

    kind: {
      type: String,
      enum: ['share', 'exchange', 'donation'],
      default: 'share',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['open', 'accepted', 'completed', 'cancelled'],
      default: 'open',
      required: true,
      index: true,
    },

    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('BookRequest', bookRequestSchema);
