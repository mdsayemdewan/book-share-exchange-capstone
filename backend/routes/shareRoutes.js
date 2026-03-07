import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ShareBook from '../models/ShareBook.js';
import BorrowRequest from '../models/BorrowRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// ── Create a share listing ──────────────────────────────────────────
router.post('/books', requireAuth, async (req, res) => {
  const { bookName, condition, category, location, lat, lng, imageUrls, borrowDuration } = req.body || {};
  if (!bookName || !condition || !category || !location || !borrowDuration) {
    return res.status(400).json({ message: 'bookName, condition, category, location, borrowDuration are required' });
  }
  if (!['new', 'good', 'used'].includes(condition)) {
    return res.status(400).json({ message: 'condition must be new/good/used' });
  }

  const book = await ShareBook.create({
    owner: req.user.id,
    bookName,
    condition,
    category,
    locationText: location,
    location: {
      lat: typeof lat === 'number' ? lat : undefined,
      lng: typeof lng === 'number' ? lng : undefined,
    },
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    borrowDuration: Number(borrowDuration),
  });

  // Award 1 point for sharing a book
  await User.findByIdAndUpdate(req.user.id, { $inc: { points: 1 } });

  return res.status(201).json({ book });
});

// ── Public list (map + cards) ───────────────────────────────────────
router.get('/books', async (req, res) => {
  const books = await ShareBook.find({ status: 'available' })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('owner', 'name');

  const bookIds = books.map((b) => b._id);
  const pendingCounts = await BorrowRequest.aggregate([
    { $match: { shareBook: { $in: bookIds }, status: 'pending' } },
    { $group: { _id: '$shareBook', count: { $sum: 1 } } },
  ]);
  const pendingMap = Object.fromEntries(pendingCounts.map((p) => [String(p._id), p.count]));

  return res.json({
    books: books.map((b) => ({
      id: b._id,
      bookName: b.bookName,
      condition: b.condition,
      category: b.category,
      location: b.locationText,
      lat: b.location?.lat,
      lng: b.location?.lng,
      imageUrls: b.imageUrls || [],
      borrowDuration: b.borrowDuration,
      ownerName: b.owner?.name || 'Unknown',
      status: b.status,
      pendingRequests: pendingMap[String(b._id)] || 0,
      createdAt: b.createdAt,
    })),
  });
});

// ── Edit own listing ────────────────────────────────────────────────
router.put('/books/:id', requireAuth, async (req, res) => {
  const book = await ShareBook.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (String(book.owner) !== req.user.id) return res.status(403).json({ message: 'Not your listing' });

  const { bookName, condition, category, location, lat, lng, imageUrls, borrowDuration } = req.body || {};
  if (bookName) book.bookName = bookName;
  if (condition && ['new', 'good', 'used'].includes(condition)) book.condition = condition;
  if (category) book.category = category;
  if (location) book.locationText = location;
  if (typeof lat === 'number') book.location.lat = lat;
  if (typeof lng === 'number') book.location.lng = lng;
  if (Array.isArray(imageUrls)) book.imageUrls = imageUrls;
  if (borrowDuration) book.borrowDuration = Number(borrowDuration);
  await book.save();

  return res.json({ book });
});

// ── Delete own listing ──────────────────────────────────────────────
router.delete('/books/:id', requireAuth, async (req, res) => {
  const book = await ShareBook.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (String(book.owner) !== req.user.id) return res.status(403).json({ message: 'Not your listing' });

  await BorrowRequest.deleteMany({ shareBook: book._id, status: 'pending' });
  await book.deleteOne();

  return res.json({ message: 'Listing deleted' });
});

// ── Request to borrow ───────────────────────────────────────────────
router.post('/books/:id/borrow', requireAuth, async (req, res) => {
  const { message } = req.body || {};
  const book = await ShareBook.findById(req.params.id).populate('owner', 'name');
  if (!book || book.status !== 'available') return res.status(404).json({ message: 'Book not available' });
  if (String(book.owner._id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot borrow your own book' });
  }

  const existing = await BorrowRequest.findOne({
    shareBook: book._id,
    borrower: req.user.id,
    status: 'pending',
  });
  if (existing) return res.status(400).json({ message: 'You already have a pending request for this book' });

  const br = await BorrowRequest.create({
    shareBook: book._id,
    owner: book.owner._id,
    borrower: req.user.id,
    message: message || '',
  });

  await Notification.create({
    user: book.owner._id,
    type: 'borrow_request',
    message: `New borrow request for "${book.bookName}"`,
    data: { shareBookId: book._id, borrowRequestId: br._id },
  });

  return res.status(201).json({ request: br });
});

// ── Owner views requests for a listing ──────────────────────────────
router.get('/books/:id/requests', requireAuth, async (req, res) => {
  const book = await ShareBook.findById(req.params.id);
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (String(book.owner) !== req.user.id) return res.status(403).json({ message: 'Only the owner can view requests' });

  const requests = await BorrowRequest.find({ shareBook: book._id })
    .sort({ createdAt: -1 })
    .populate('borrower', 'name');

  return res.json({ requests });
});

// ── Approve borrow ──────────────────────────────────────────────────
router.post('/requests/:id/approve', requireAuth, async (req, res) => {
  const br = await BorrowRequest.findById(req.params.id).populate('borrower', 'name');
  if (!br) return res.status(404).json({ message: 'Request not found' });
  if (String(br.owner) !== req.user.id) return res.status(403).json({ message: 'Only the owner can approve' });
  if (br.status !== 'pending') return res.status(400).json({ message: 'Request is not pending' });

  const book = await ShareBook.findById(br.shareBook);

  const now = new Date();
  br.status = 'approved';
  br.borrowedAt = now;
  br.dueDate = new Date(now.getTime() + (book.borrowDuration * 24 * 60 * 60 * 1000));
  await br.save();

  book.status = 'borrowed';
  await book.save();

  await BorrowRequest.updateMany(
    { shareBook: book._id, _id: { $ne: br._id }, status: 'pending' },
    { status: 'rejected' }
  );

  await Notification.create({
    user: br.borrower._id,
    type: 'borrow_approved',
    message: `Your borrow request for "${book.bookName}" was approved! Due: ${br.dueDate.toLocaleDateString()}`,
    data: { shareBookId: book._id, borrowRequestId: br._id },
  });

  return res.json({ message: 'Borrow request approved', request: br });
});

// ── Reject borrow ───────────────────────────────────────────────────
router.post('/requests/:id/reject', requireAuth, async (req, res) => {
  const br = await BorrowRequest.findById(req.params.id).populate('borrower', 'name');
  if (!br) return res.status(404).json({ message: 'Request not found' });
  if (String(br.owner) !== req.user.id) return res.status(403).json({ message: 'Only the owner can reject' });
  if (br.status !== 'pending') return res.status(400).json({ message: 'Request is not pending' });

  br.status = 'rejected';
  await br.save();

  const book = await ShareBook.findById(br.shareBook);

  await Notification.create({
    user: br.borrower._id,
    type: 'borrow_rejected',
    message: `Your borrow request for "${book.bookName}" was rejected`,
    data: { shareBookId: book._id, borrowRequestId: br._id },
  });

  return res.json({ message: 'Borrow request rejected', request: br });
});

// ── Confirm return (either party) ───────────────────────────────────
router.post('/requests/:id/return', requireAuth, async (req, res) => {
  const br = await BorrowRequest.findById(req.params.id)
    .populate('borrower', 'name')
    .populate('owner', 'name');
  if (!br) return res.status(404).json({ message: 'Request not found' });

  const me = req.user.id;
  const isOwner = String(br.owner._id) === me;
  const isBorrower = String(br.borrower._id) === me;
  if (!isOwner && !isBorrower) return res.status(403).json({ message: 'Not a participant' });
  if (!['approved', 'overdue'].includes(br.status)) {
    return res.status(400).json({ message: 'Book is not currently borrowed' });
  }

  br.status = 'returned';
  br.returnConfirmedAt = new Date();
  await br.save();

  const book = await ShareBook.findById(br.shareBook);
  book.status = 'available';
  await book.save();

  const otherUser = isOwner ? br.borrower._id : br.owner._id;
  await Notification.create({
    user: otherUser,
    type: 'borrow_returned',
    message: `"${book.bookName}" has been marked as returned`,
    data: { shareBookId: book._id, borrowRequestId: br._id },
  });

  return res.json({ message: 'Book marked as returned', request: br });
});

// ── Report an issue ─────────────────────────────────────────────────
router.post('/requests/:id/report', requireAuth, async (req, res) => {
  const { reason } = req.body || {};
  if (!reason) return res.status(400).json({ message: 'reason is required' });

  const br = await BorrowRequest.findById(req.params.id)
    .populate('borrower', 'name')
    .populate('owner', 'name');
  if (!br) return res.status(404).json({ message: 'Request not found' });

  const me = req.user.id;
  const isOwner = String(br.owner._id) === me;
  const isBorrower = String(br.borrower._id) === me;
  if (!isOwner && !isBorrower) return res.status(403).json({ message: 'Not a participant' });

  br.reportReason = reason;
  br.reportedAt = new Date();
  br.reportedBy = me;
  await br.save();

  const book = await ShareBook.findById(br.shareBook);
  const otherUser = isOwner ? br.borrower._id : br.owner._id;
  await Notification.create({
    user: otherUser,
    type: 'borrow_report',
    message: `An issue was reported for "${book.bookName}"`,
    data: { shareBookId: book._id, borrowRequestId: br._id },
  });

  return res.json({ message: 'Report submitted', request: br });
});

// ── My listings ─────────────────────────────────────────────────────
router.get('/my/books', requireAuth, async (req, res) => {
  const books = await ShareBook.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30);

  return res.json({ books });
});

// ── My borrow requests (as borrower) ───────────────────────────────
router.get('/my/borrows', requireAuth, async (req, res) => {
  const requests = await BorrowRequest.find({ borrower: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('shareBook', 'bookName condition category locationText borrowDuration imageUrls')
    .populate('owner', 'name phone');

  return res.json({ requests });
});

// ── Active borrows (both sides – for due dates, overdue tracking) ──
router.get('/my/active', requireAuth, async (req, res) => {
  const now = new Date();

  await BorrowRequest.updateMany(
    { status: 'approved', dueDate: { $lt: now } },
    { status: 'overdue' }
  );

  const active = await BorrowRequest.find({
    status: { $in: ['approved', 'overdue', 'returned'] },
    $or: [{ owner: req.user.id }, { borrower: req.user.id }],
  })
    .sort({ dueDate: 1 })
    .limit(30)
    .populate('shareBook', 'bookName condition category locationText borrowDuration imageUrls')
    .populate('owner', 'name phone')
    .populate('borrower', 'name phone');

  return res.json({
    active: active.map((a) => ({
      id: a._id,
      bookName: a.shareBook?.bookName,
      category: a.shareBook?.category,
      condition: a.shareBook?.condition,
      imageUrl: a.shareBook?.imageUrls?.[0] || '',
      borrowDuration: a.shareBook?.borrowDuration,
      status: a.status,
      borrowedAt: a.borrowedAt,
      dueDate: a.dueDate,
      returnConfirmedAt: a.returnConfirmedAt,
      reportReason: a.reportReason,
      reportedAt: a.reportedAt,
      isOwner: String(a.owner?._id) === req.user.id,
      ownerName: a.owner?.name,
      ownerPhone: a.owner?.phone,
      borrowerName: a.borrower?.name,
      borrowerPhone: a.borrower?.phone,
    })),
  });
});

export default router;
