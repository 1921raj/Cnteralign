import express from 'express';
import { generateFormSchema } from '../services/geminiService.js';
import { getRelevantForms } from '../services/memoryService.js';
import Form from '../models/Form.js';
import jwt from 'jsonwebtoken';
import { generateEmbedding } from '../services/geminiService.js';
import { upsertVector } from '../services/pineconeService.js';

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

        // 4. Store in Memory (Pinecone)
        // We do this asynchronously so we don't block the response too long, 
        // but for reliability in this demo we'll await it or just fire and forget with a catch.
        try {
            const embedding = await generateEmbedding(prompt);

            // Extract field names for metadata to help with context later
            const fieldNames = schema.fields ? schema.fields.map(f => f.name) : [];

            await upsertVector(newForm._id, embedding, {
                userId: req.user._id.toString(),
                purpose: prompt,
                title: schema.title || 'Untitled',
                fields: JSON.stringify(fieldNames),
                createdAt: new Date().toISOString()
            });
            console.log("Form stored in memory successfully.");
        } catch (memoryError) {
            console.error("Failed to store form in memory:", memoryError);
            // Non-blocking error for the user
        }

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
