import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import formRoutes from './routes/form.routes.js';
import uploadRoutes from './routes/upload.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
    res.send('AI Form Builder API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
