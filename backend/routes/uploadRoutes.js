import express from 'express';
import { uploadBase64ToImgbb } from '../utils/imgbb.js';

const router = express.Router();

// Body format:
// { images: [{ base64: "data:image/...;base64,...", name?: "file1" }, ...] }
// Public endpoint: needed for signup profile images.
router.post('/imgbb', async (req, res) => {
  try {
    const images = req.body?.images;
    if (!Array.isArray(images) || images.length < 1) {
      return res.status(400).json({ message: 'images array is required' });
    }
    if (images.length > 6) {
      return res.status(400).json({ message: 'Maximum 6 images allowed' });
    }

    const uploads = [];
    for (const img of images) {
      uploads.push(uploadBase64ToImgbb({ base64: img?.base64, name: img?.name }));
    }

    const results = await Promise.all(uploads);
    return res.status(201).json({ images: results });
  } catch (err) {
    console.error('ImgBB upload error:', err);
    return res.status(500).json({ message: err?.message || 'Image upload failed. Try smaller images.' });
  }
});

export default router;
