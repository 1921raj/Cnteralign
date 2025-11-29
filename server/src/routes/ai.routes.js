import express from 'express';
import { generateFormSchema } from '../services/geminiService.js';
import { getRelevantForms } from '../services/memoryService.js';
import Form from '../models/Form.js';
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

// @route   POST /api/ai/generate
// @desc    Generate a form schema based on prompt
// @access  Private
router.post('/generate', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required' });
    }

    try {
        // 1. Retrieve relevant context
        const context = await getRelevantForms(req.user._id, prompt);

        // 2. Generate schema with context
        const schema = await generateFormSchema(prompt, context);

        // 3. Save the generated form (optional: user might want to edit before saving, 
        // but requirements say "Persist generated schema into MongoDB")
        // Let's save it.

        const newForm = new Form({
            user: req.user._id,
            title: schema.title || 'Untitled Form',
            description: schema.description,
            purpose: prompt,
            schema: schema,
            keywords: prompt.split(' '), // Simple keyword storage
        });

        await newForm.save();

        res.json(newForm);
    } catch (error) {
        console.error('AI Generation Error:', error);
        console.error('Error Stack:', error.stack);
        console.error('Error Message:', error.message);
        res.status(500).json({
            message: 'Failed to generate form',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;
