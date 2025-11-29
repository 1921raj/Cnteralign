import express from 'express';
import Form from '../models/Form.js';
import Submission from '../models/Submission.js';
import jwt from 'jsonwebtoken';
import { generateEmbedding } from '../services/geminiService.js';
import { queryVectors } from '../services/pineconeService.js';

const router = express.Router();

// Middleware to verify token (should be moved to a separate middleware file)
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = { _id: decoded.id };
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   GET /api/forms
// @desc    Get all forms for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const forms = await Form.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(forms);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/forms/search
// @desc    Search forms using vector similarity (Pinecone)
// @access  Private
router.get('/search', protect, async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Query is required' });
    }

    try {
        console.log(`Searching for: "${q}"`);

        // 1. Generate embedding for the query
        const embedding = await generateEmbedding(q);

        // 2. Query Pinecone
        const matches = await queryVectors(embedding, 10, req.user._id);

        if (matches.length === 0) {
            return res.json([]);
        }

        // 3. Extract Form IDs
        const formIds = matches.map(match => match.id);

        // 4. Fetch full form details from MongoDB
        const forms = await Form.find({
            _id: { $in: formIds },
            user: req.user._id
        });

        // Optional: Sort forms by the order returned from Pinecone (relevance)
        const sortedForms = formIds.map(id => forms.find(f => f._id.toString() === id)).filter(f => f);

        res.json(sortedForms);
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
});

// @route   GET /api/forms/:id
// @desc    Get a single form by ID (Public)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/forms/:id/submissions
// @desc    Get all submissions for a form
// @access  Private
router.get('/:id/submissions', protect, async (req, res) => {
    try {
        const submissions = await Submission.find({ form: req.params.id }).sort({ createdAt: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/forms/:id/submit
// @desc    Submit a form response
// @access  Public
router.post('/:id/submit', async (req, res) => {
    const { responses } = req.body;

    if (!responses) {
        return res.status(400).json({ message: 'Responses are required' });
    }

    try {
        const submission = new Submission({
            form: req.params.id,
            responses,
        });

        await submission.save();

        res.status(201).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
