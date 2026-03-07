import express from 'express';
import BookRequest from '../models/BookRequest.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { title, notes, kind = 'share' } = req.body || {};
  if (!title) return res.status(400).json({ message: 'title is required' });
  if (!['share', 'exchange', 'donation'].includes(kind)) {
    return res.status(400).json({ message: 'invalid kind' });
  }

  const request = await BookRequest.create({
    requestedBy: req.user.id,
    title,
    notes: notes || '',
    kind,
    status: 'open',
  });

  return res.status(201).json({ request });
});

router.get('/', requireAuth, async (req, res) => {
  const { status = 'open', mine } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (mine === 'true') filter.requestedBy = req.user.id;

  const requests = await BookRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('requestedBy', 'name')
    .populate('acceptedBy', 'name');

  return res.json({ requests });
});

// Public feed: open requests only, limited fields, no contact details.
router.get('/public', async (req, res) => {
  const requests = await BookRequest.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('requestedBy', 'name');

  return res.json({
    requests: requests.map((r) => ({
      id: r._id,
      title: r.title,
      notes: r.notes,
      kind: r.kind,
      status: r.status,
      createdAt: r.createdAt,
      requestedBy: r.requestedBy?.name || 'Unknown',
    })),
  });
});

router.post('/:id/accept', requireAuth, async (req, res) => {
  const request = await BookRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'open') return res.status(400).json({ message: 'Request is not open' });
  if (String(request.requestedBy) === req.user.id) {
    return res.status(400).json({ message: 'You cannot accept your own request' });
  }

  request.status = 'accepted';
  request.acceptedBy = req.user.id;
  request.acceptedAt = new Date();
  await request.save();

  return res.json({ message: 'Request accepted', request });
});

router.get('/:id', requireAuth, async (req, res) => {
  const request = await BookRequest.findById(req.params.id)
    .populate('requestedBy', 'name email phone location imageUrls')
    .populate('acceptedBy', 'name email phone location imageUrls');

  if (!request) return res.status(404).json({ message: 'Request not found' });

  const isRequester = String(request.requestedBy?._id) === req.user.id;
  const isAccepter = request.acceptedBy && String(request.acceptedBy?._id) === req.user.id;

  // Contact reveal rule:
  // - Only requester can see acceptedBy contact details, and only after accepted.
  let acceptedBy = request.acceptedBy;
  if (!request.acceptedBy || request.status !== 'accepted' || !isRequester) {
    acceptedBy = request.acceptedBy
      ? { _id: request.acceptedBy._id, name: request.acceptedBy.name }
      : null;
  }

  const requestedBy = isRequester || isAccepter
    ? request.requestedBy
    : { _id: request.requestedBy._id, name: request.requestedBy.name };

  return res.json({
    request: {
      id: request._id,
      title: request.title,
      notes: request.notes,
      status: request.status,
      acceptedAt: request.acceptedAt,
      createdAt: request.createdAt,
      requestedBy,
      acceptedBy,
    },
  });
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  const request = await BookRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.requestedBy) !== req.user.id) {
    return res.status(403).json({ message: 'Only the requester can complete this request' });
  }
  if (request.status !== 'accepted') return res.status(400).json({ message: 'Request is not accepted' });

  request.status = 'completed';
  await request.save();
  return res.json({ message: 'Request completed', request });
});

router.post('/:id/cancel', requireAuth, async (req, res) => {
  const request = await BookRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (String(request.requestedBy) !== req.user.id) {
    return res.status(403).json({ message: 'Only the requester can cancel this request' });
  }
  if (request.status === 'completed') return res.status(400).json({ message: 'Cannot cancel a completed request' });

  request.status = 'cancelled';
  await request.save();
  return res.json({ message: 'Request cancelled', request });
});

export default router;
