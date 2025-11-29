import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});




const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ai-form-builder',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    },
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Upload a file
// @access  Public (or Private depending on needs)
router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
});

export default router;
