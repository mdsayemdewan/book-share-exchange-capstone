import mongoose from 'mongoose';

const borrowRequestSchema = new mongoose.Schema(
  {
    shareBook: { type: mongoose.Schema.Types.ObjectId, ref: 'ShareBook', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'returned', 'overdue'],
      default: 'pending',
      required: true,
      index: true,
    },
    borrowedAt: { type: Date },
    dueDate: { type: Date },
    returnConfirmedAt: { type: Date },
    reportReason: { type: String, trim: true, default: '' },
    reportedAt: { type: Date },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('BorrowRequest', borrowRequestSchema);
