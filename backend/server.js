import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import exchangeRoutes from './routes/exchangeRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import userRoutes from './routes/userRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://book-share-exchange-capstone.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
connectDB();

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Book Distribution API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
