import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    exchangeRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExchangeRequest',
      required: true,
      index: true,
    },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true, trim: true },
    // TTL index: messages expire after 2 days
    createdAt: { type: Date, default: Date.now, index: { expires: '2d' } },
  },
  { timestamps: false }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
