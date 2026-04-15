import express from 'express';
import User from '../models/User.js';
import ShareBook from '../models/ShareBook.js';
import BorrowRequest from '../models/BorrowRequest.js';
import ExchangeOffer from '../models/ExchangeOffer.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const users = await User.find(filter).sort({ createdAt: -1 });
  return res.json({
    users: users.map((u) => ({
      id: u._id,
      role: u.role,
      status: u.status,
      name: u.name,
      email: u.email,
      phone: u.phone,
      location: u.location,
      imageUrls: u.imageUrls,
      createdAt: u.createdAt,
    })),
  });
});

router.patch('/users/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'approved' },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'User approved', user: { id: user._id, status: user.status } });
});

router.patch('/users/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected' },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'User rejected', user: { id: user._id, status: user.status } });
});

// Reset all users' points to 0
router.patch('/reset-points', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await User.updateMany(
      { status: 'approved' },
      { $set: { points: 0 } }
    );
    return res.json({
      message: 'All user points have been reset to 0.',
      usersReset: result.modifiedCount,
    });
  } catch (err) {
    console.error('Reset points error:', err);
    return res.status(500).json({ message: 'Server error while resetting points.' });
  }
});

// ── View any user profile ───────────────────────────────────────────
router.get('/users/:id/profile', requireAuth, requireAdmin, async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    return res.json({
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        location: u.location,
        imageUrls: u.imageUrls,
        role: u.role,
        status: u.status,
        points: u.points,
        createdAt: u.createdAt,
      },
    });
  } catch (err) {
    console.error('Admin get user profile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── All share posts (admin) ──────────────────────────────────────────
router.get('/shares', requireAuth, requireAdmin, async (req, res) => {
  try {
    const books = await ShareBook.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');
    return res.json({
      books: books.map((b) => ({
        id: b._id,
        bookName: b.bookName,
        condition: b.condition,
        category: b.category,
        location: b.locationText,
        imageUrls: b.imageUrls || [],
        borrowDuration: b.borrowDuration,
        status: b.status,
        ownerName: b.owner?.name || 'Unknown',
        ownerEmail: b.owner?.email || '',
        ownerId: b.owner?._id,
        createdAt: b.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin get shares error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── Delete any share post (admin) ────────────────────────────────────
router.delete('/shares/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const book = await ShareBook.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Share post not found' });
    await BorrowRequest.deleteMany({ shareBook: book._id });
    await book.deleteOne();
    return res.json({ message: 'Share post deleted by admin' });
  } catch (err) {
    console.error('Admin delete share error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── All exchange posts (admin) ───────────────────────────────────────
router.get('/exchanges', requireAuth, requireAdmin, async (req, res) => {
  try {
    const offers = await ExchangeOffer.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name email');
    return res.json({
      offers: offers.map((o) => ({
        id: o._id,
        bookName: o.bookName,
        condition: o.condition,
        category: o.category,
        location: o.locationText,
        imageUrls: o.imageUrls || [],
        wantedBook: o.wantedBook,
        status: o.status,
        ownerName: o.owner?.name || 'Unknown',
        ownerEmail: o.owner?.email || '',
        ownerId: o.owner?._id,
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin get exchanges error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ── Delete any exchange post (admin) ─────────────────────────────────
router.delete('/exchanges/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const offer = await ExchangeOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Exchange post not found' });
    await ExchangeRequest.deleteMany({ offer: offer._id });
    await offer.deleteOne();
    return res.json({ message: 'Exchange post deleted by admin' });
  } catch (err) {
    console.error('Admin delete exchange error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
