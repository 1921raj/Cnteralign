import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import aiRoutes from '../src/routes/ai.routes.js';
import Form from '../src/models/Form.js';
import User from '../src/models/User.js';

// Mock the services
jest.mock('../src/services/geminiService.js', () => ({
    generateFormSchema: jest.fn()
}));

jest.mock('../src/services/memoryService.js', () => ({
    getRelevantForms: jest.fn()
}));

import { generateFormSchema } from '../src/services/geminiService.js';
import { getRelevantForms } from '../src/services/memoryService.js';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

// Mock environment variables
process.env.JWT_SECRET = 'testsecret';

describe('AI Routes', () => {
    let user;
    let token;

    beforeEach(async () => {
        // Create a test user
        user = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        await user.save();

        // Generate token
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        // Reset mocks
        jest.clearAllMocks();
    });

    describe('POST /api/ai/generate', () => {
        it('should generate a form schema and save it', async () => {
            const mockSchema = {
                title: 'Test Form',
                description: 'A test form',
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string' }
                }
            };

            getRelevantForms.mockResolvedValue([]);
            generateFormSchema.mockResolvedValue(mockSchema);

            const response = await request(app)
                .post('/api/ai/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({ prompt: 'Create a contact form' });

            expect(response.statusCode).toBe(200);
            expect(response.body.title).toBe('Test Form');
            expect(response.body.description).toBe('A test form');
            expect(response.body.user).toBe(user._id.toString());

            // Check if form was saved
            const savedForm = await Form.findOne({ user: user._id });
            expect(savedForm).toBeTruthy();
            expect(savedForm.title).toBe('Test Form');

            expect(getRelevantForms).toHaveBeenCalledWith(user._id, 'Create a contact form');
            expect(generateFormSchema).toHaveBeenCalledWith('Create a contact form', []);
        });

        it('should return 400 if prompt is missing', async () => {
            const response = await request(app)
                .post('/api/ai/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('Prompt is required');
        });

        it('should return 401 if no token provided', async () => {
            const response = await request(app)
                .post('/api/ai/generate')
                .send({ prompt: 'Create a form' });

            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe('Not authorized, no token');
        });

        it('should handle service errors', async () => {
            getRelevantForms.mockRejectedValue(new Error('Service error'));

            const response = await request(app)
                .post('/api/ai/generate')
                .set('Authorization', `Bearer ${token}`)
                .send({ prompt: 'Create a form' });

            expect(response.statusCode).toBe(500);
            expect(response.body.message).toBe('Failed to generate form');
        });
    });
});
