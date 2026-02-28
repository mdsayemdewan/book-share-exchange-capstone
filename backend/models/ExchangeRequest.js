import mongoose from 'mongoose';

const exchangeRequestSchema = new mongoose.Schema(
  {
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'ExchangeOffer', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // offer owner
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offeredBook: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    // Snapshot of initial books for summary
    initialOwnerBook: { type: String, trim: true },
    initialFromUserBook: { type: String, trim: true },
    // Final agreed books after conversation (can be same as initial)
    finalOwnerBook: { type: String, trim: true },
    finalFromUserBook: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ExchangeRequest', exchangeRequestSchema);
