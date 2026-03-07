import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ExchangeOffer from '../models/ExchangeOffer.js';
import ExchangeRequest from '../models/ExchangeRequest.js';
import ChatMessage from '../models/ChatMessage.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Step 1: create an exchange offer
router.post('/offers', requireAuth, async (req, res) => {
  const { bookName, condition, category, location, wantedBook, lat, lng, imageUrls } = req.body || {};
  if (!bookName || !condition || !category || !location) {
    return res.status(400).json({ message: 'bookName, condition, category, location are required' });
  }
  if (!['new', 'good', 'used'].includes(condition)) {
    return res.status(400).json({ message: 'condition must be new/good/used' });
  }

  const offer = await ExchangeOffer.create({
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
    wantedBook: wantedBook || '',
  });

  return res.status(201).json({ offer });
});

// Public list of open offers (no contact details)
router.get('/offers', async (req, res) => {
  const offers = await ExchangeOffer.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('owner', 'name');

  const offerIds = offers.map((o) => o._id);
  const pendingCounts = await ExchangeRequest.aggregate([
    { $match: { offer: { $in: offerIds }, status: 'pending' } },
    { $group: { _id: '$offer', count: { $sum: 1 } } },
  ]);
  const pendingMap = Object.fromEntries(pendingCounts.map((p) => [String(p._id), p.count]));

  return res.json({
    offers: offers.map((o) => ({
      id: o._id,
      bookName: o.bookName,
      condition: o.condition,
      category: o.category,
      location: o.locationText,
      lat: o.location?.lat,
      lng: o.location?.lng,
      imageUrls: o.imageUrls || [],
      wantedBook: o.wantedBook,
      ownerName: o.owner?.name || 'Unknown',
      status: o.status,
      pendingRequests: pendingMap[String(o._id)] || 0,
      createdAt: o.createdAt,
    })),
  });
});

// Step 2: other user sends exchange request
router.post('/offers/:id/requests', requireAuth, async (req, res) => {
  const { offeredBook, message } = req.body || {};
  if (!offeredBook) return res.status(400).json({ message: 'offeredBook is required' });

  const offer = await ExchangeOffer.findById(req.params.id).populate('owner', 'name');
  if (!offer || offer.status !== 'open') return res.status(404).json({ message: 'Offer not available' });
  if (String(offer.owner._id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot request your own offer' });
  }

  const exReq = await ExchangeRequest.create({
    offer: offer._id,
    owner: offer.owner._id,
    fromUser: req.user.id,
    offeredBook,
    message: message || '',
    initialOwnerBook: offer.bookName,
    initialFromUserBook: offeredBook,
  });

  await Notification.create({
    user: offer.owner._id,
    type: 'exchange_request',
    message: `New exchange request for "${offer.bookName}"`,
    data: { offerId: offer._id, requestId: exReq._id },
  });

  return res.status(201).json({ request: exReq });
});

// Step 3: owner reviews requests for their offer
router.get('/offers/:id/requests', requireAuth, async (req, res) => {
  const offer = await ExchangeOffer.findById(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  if (String(offer.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Only the owner can view requests' });
  }

  const requests = await ExchangeRequest.find({ offer: offer._id })
    .sort({ createdAt: -1 })
    .populate('fromUser', 'name');

  return res.json({ requests });
});

// Owner accepts / rejects a request
router.post('/requests/:id/accept', requireAuth, async (req, res) => {
  const { finalOwnerBook, finalFromUserBook } = req.body || {};
  const exReq = await ExchangeRequest.findById(req.params.id).populate('fromUser', 'name');
  if (!exReq) return res.status(404).json({ message: 'Request not found' });
  if (String(exReq.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Only the owner can accept this request' });
  }

  exReq.status = 'accepted';
  exReq.finalOwnerBook = finalOwnerBook || exReq.initialOwnerBook || '';
  exReq.finalFromUserBook = finalFromUserBook || exReq.initialFromUserBook || exReq.offeredBook;
  await exReq.save();

  await ExchangeOffer.findByIdAndUpdate(exReq.offer, { status: 'closed' });

  await Notification.create({
    user: exReq.fromUser._id,
    type: 'exchange_request_accepted',
    message: `Your exchange request for "${exReq.offeredBook}" was accepted`,
    data: { requestId: exReq._id, offerId: exReq.offer },
  });

  // Award 1 point to both users for a successful exchange
  const ownerId = exReq.owner._id || exReq.owner;
  const fromUserId = exReq.fromUser._id || exReq.fromUser;
  await User.findByIdAndUpdate(ownerId, { $inc: { points: 1 } });
  await User.findByIdAndUpdate(fromUserId, { $inc: { points: 1 } });

  return res.json({ message: 'Exchange request accepted', request: exReq });
});

router.post('/requests/:id/reject', requireAuth, async (req, res) => {
  const { message } = req.body || {};
  const exReq = await ExchangeRequest.findById(req.params.id).populate('fromUser', 'name');
  if (!exReq) return res.status(404).json({ message: 'Request not found' });
  if (String(exReq.owner) !== req.user.id) {
    return res.status(403).json({ message: 'Only the owner can reject this request' });
  }

  exReq.status = 'rejected';
  if (message) exReq.rejectMessage = message;
  await exReq.save();

  await Notification.create({
    user: exReq.fromUser._id,
    type: 'exchange_request_rejected',
    message: `Your exchange request for "${exReq.offeredBook}" was rejected.${message ? ' Reason: ' + message : ''}`,
    data: { requestId: exReq._id, offerId: exReq.offer },
  });

  return res.json({ message: 'Exchange request rejected', request: exReq });
});

// Owner edits their own offer
router.put('/offers/:id', requireAuth, async (req, res) => {
  const offer = await ExchangeOffer.findById(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  if (String(offer.owner) !== req.user.id) return res.status(403).json({ message: 'Not your offer' });

  const { bookName, condition, category, location, wantedBook, lat, lng, imageUrls } = req.body || {};
  if (bookName) offer.bookName = bookName;
  if (condition && ['new', 'good', 'used'].includes(condition)) offer.condition = condition;
  if (category) offer.category = category;
  if (location) offer.locationText = location;
  if (wantedBook !== undefined) offer.wantedBook = wantedBook;
  if (typeof lat === 'number') offer.location.lat = lat;
  if (typeof lng === 'number') offer.location.lng = lng;
  if (Array.isArray(imageUrls)) offer.imageUrls = imageUrls;
  await offer.save();

  return res.json({ offer });
});

// Owner deletes their own offer
router.delete('/offers/:id', requireAuth, async (req, res) => {
  const offer = await ExchangeOffer.findById(req.params.id);
  if (!offer) return res.status(404).json({ message: 'Offer not found' });
  if (String(offer.owner) !== req.user.id) return res.status(403).json({ message: 'Not your offer' });

  await ExchangeRequest.deleteMany({ offer: offer._id });
  await offer.deleteOne();

  return res.json({ message: 'Offer deleted' });
});

// Owner's own offers (for reviewing incoming requests)
router.get('/my/offers', requireAuth, async (req, res) => {
  const offers = await ExchangeOffer.find({ owner: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30);

  return res.json({ offers });
});

// For dashboards: my outgoing requests and accepted exchanges
router.get('/my/requests', requireAuth, async (req, res) => {
  const requests = await ExchangeRequest.find({ fromUser: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate('offer', 'bookName condition category locationText wantedBook');

  return res.json({ requests });
});

router.get('/my/exchanges', requireAuth, async (req, res) => {
  const exchanges = await ExchangeRequest.find({
    status: 'accepted',
    $or: [{ owner: req.user.id }, { fromUser: req.user.id }],
  })
    .sort({ updatedAt: -1 })
    .limit(30)
    .populate('offer', 'bookName')
    .populate('owner', 'name phone')
    .populate('fromUser', 'name phone');

  return res.json({
    exchanges: exchanges.map((e) => ({
      id: e._id,
      offerBook: e.initialOwnerBook || e.offer?.bookName,
      requesterBook: e.initialFromUserBook || e.offeredBook,
      finalOwnerBook: e.finalOwnerBook || e.initialOwnerBook || e.offer?.bookName,
      finalFromUserBook: e.finalFromUserBook || e.initialFromUserBook || e.offeredBook,
      ownerName: e.owner?.name,
      ownerPhone: e.owner?.phone,
      requesterName: e.fromUser?.name,
      requesterPhone: e.fromUser?.phone,
      isOwner: String(e.owner?._id) === req.user.id,
      updatedAt: e.updatedAt,
    })),
  });
});

// Step 4: chat after acceptance
router.get('/requests/:id/chat', requireAuth, async (req, res) => {
  const exReq = await ExchangeRequest.findById(req.params.id).populate('owner fromUser');
  if (!exReq) return res.status(404).json({ message: 'Request not found' });
  if (!['accepted'].includes(exReq.status)) {
    return res.status(400).json({ message: 'Chat is only available after acceptance' });
  }

  const me = req.user.id;
  const isParticipant = [String(exReq.owner._id), String(exReq.fromUser._id)].includes(me);
  if (!isParticipant) return res.status(403).json({ message: 'Not a participant in this exchange' });

  const messages = await ChatMessage.find({ exchangeRequest: exReq._id }).sort({ createdAt: 1 });
  return res.json({ messages });
});

router.post('/requests/:id/chat', requireAuth, async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ message: 'text is required' });

  const exReq = await ExchangeRequest.findById(req.params.id).populate('owner fromUser');
  if (!exReq) return res.status(404).json({ message: 'Request not found' });
  if (exReq.status !== 'accepted') {
    return res.status(400).json({ message: 'Chat is only available after acceptance' });
  }

  const me = req.user.id;
  const ownerId = String(exReq.owner._id);
  const fromId = String(exReq.fromUser._id);
  if (![ownerId, fromId].includes(me)) {
    return res.status(403).json({ message: 'Not a participant in this exchange' });
  }

  const to = me === ownerId ? exReq.fromUser._id : exReq.owner._id;

  const msg = await ChatMessage.create({
    exchangeRequest: exReq._id,
    from: me,
    to,
    text,
  });

  await Notification.create({
    user: to,
    type: 'chat_message',
    message: `New chat message about "${exReq.offeredBook}"`,
    data: { requestId: exReq._id, offerId: exReq.offer },
  });

  return res.status(201).json({ message: msg });
});

export default router;
