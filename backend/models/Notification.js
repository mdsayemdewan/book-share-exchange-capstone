import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'exchange_request',
        'exchange_request_accepted',
        'exchange_request_rejected',
        'chat_message',
        'borrow_request',
        'borrow_approved',
        'borrow_rejected',
        'borrow_returned',
        'borrow_report'
      ],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    data: { type: Object, default: {} },
    isRead: { type: Boolean, default: false, index: true },
    // TTL index: notifications expire after 7 days
    createdAt: { type: Date, default: Date.now, index: { expires: '7d' } },
  },
  { timestamps: false }
);

export default mongoose.model('Notification', notificationSchema);
