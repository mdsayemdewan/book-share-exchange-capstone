import express from 'express';
import ShareBook from '../models/ShareBook.js';
import ExchangeOffer from '../models/ExchangeOffer.js';

const router = express.Router();

router.get('/recent', async (req, res) => {
    try {
        const recentShares = await ShareBook.find({ status: 'available' })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('owner', 'name');

        const recentExchanges = await ExchangeOffer.find({ status: 'open' })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate('owner', 'name');

        return res.json({
            shares: recentShares.map((b) => ({
                id: b._id,
                bookName: b.bookName,
                condition: b.condition,
                category: b.category,
                location: b.locationText,
                imageUrls: b.imageUrls || [],
                borrowDuration: b.borrowDuration,
                ownerName: b.owner?.name || 'Unknown',
                createdAt: b.createdAt,
            })),
            exchanges: recentExchanges.map((o) => ({
                id: o._id,
                bookName: o.bookName,
                condition: o.condition,
                category: o.category,
                location: o.locationText,
                imageUrls: o.imageUrls || [],
                wantedBook: o.wantedBook,
                ownerName: o.owner?.name || 'Unknown',
                createdAt: o.createdAt,
            })),
        });
    } catch (error) {
        console.error('Error fetching home recent data:', error);
        return res.status(500).json({ message: 'Error fetching recent data' });
    }
});

export default router;
