import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const signToken = (user) =>
    jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password, lat, lng, imageUrls } = req.body || {};

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'name, email, phone, password are required' });
        }
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({ message: 'lat and lng must be numbers' });
        }
        if (!Array.isArray(imageUrls) || imageUrls.length < 1) {
            return res.status(400).json({ message: 'At least one profile image is required' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            role: 'user',
            status: 'pending',
            name,
            email,
            phone,
            passwordHash,
            location: { lat, lng },
            imageUrls,
        });

        return res.status(201).json({
            message: 'Signup successful. Your account is pending admin approval.',
            user: { id: user._id, role: user.role, status: user.status, name: user.name, email: user.email },
        });
    } catch (err) {
        if (err?.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(409).json({ message: `${field} already exists` });
        }
        return res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        if (user.status !== 'approved') {
            return res.status(403).json({ message: `Account is ${user.status}. Please wait for admin approval.` });
        }

        const token = signToken(user);
        return res.json({
            token,
            user: { id: user._id, role: user.role, status: user.status, name: user.name, email: user.email, points: user.points },
        });
    } catch {
        return res.status(500).json({ message: 'Server error' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({
        user: {
            id: user._id,
            role: user.role,
            status: user.status,
            name: user.name,
            email: user.email,
            phone: user.phone,
            location: user.location,
            imageUrls: user.imageUrls,
            points: user.points,
        },
    });
});

export default router;
