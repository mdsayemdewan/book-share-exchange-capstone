import express from 'express';
import User from '../models/User.js';
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

export default router;
