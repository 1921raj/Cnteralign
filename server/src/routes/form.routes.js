import express from 'express';
import Form from '../models/Form.js';
import Submission from '../models/Submission.js';
import jwt from 'jsonwebtoken';

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
