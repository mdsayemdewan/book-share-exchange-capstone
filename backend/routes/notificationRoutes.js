import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  return res.json({ notifications, unreadCount });
});

router.patch('/:id/read', requireAuth, async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!n) return res.status(404).json({ message: 'Notification not found' });
  return res.json({ notification: n });
});

export default router;
