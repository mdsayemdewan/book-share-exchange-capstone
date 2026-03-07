import express from 'express';
import User from '../models/User.js';

const router = express.Router();

router.get('/ranking', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({ status: 'approved' })
            .sort({ points: -1 })
            .skip(skip)
            .limit(limit)
            .select('name email points imageUrls location role status');

        const total = await User.countDocuments({ status: 'approved' });

        res.json({
            users: users.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                points: u.points,
                imageUrls: u.imageUrls,
                location: u.location,
                role: u.role,
                status: u.status,
            })),
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
        });
    } catch (error) {
        console.error('Error fetching user ranking:', error);
        res.status(500).json({ message: 'Server error fetching user ranking' });
    }
});

export default router;
