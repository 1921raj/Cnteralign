import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Form from '../src/models/Form.js';
import Submission from '../src/models/Submission.js';
import User from '../src/models/User.js';
import formRoutes from '../src/routes/form.routes.js';

const app = express();
app.use(express.json());
app.use('/api/forms', formRoutes);

// Mock JWT secret for testing
process.env.JWT_SECRET = 'testsecret';

describe('Form Routes', () => {
    let user;
    let token;
    let form;

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

        // Create a test form
        form = new Form({
            user: user._id,
            title: 'Test Form',
            description: 'A test form',
            purpose: 'Testing purposes',
            schema: { type: 'object', properties: { name: { type: 'string' } } }
        });
        await form.save();
    });

    describe('GET /api/forms', () => {
        it('should return all forms for authenticated user', async () => {
            const res = await request(app)
                .get('/api/forms')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Test Form');
        });

        it('should return 401 if no token provided', async () => {
            const res = await request(app)
                .get('/api/forms');

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Not authorized, no token');
        });
    });

    describe('GET /api/forms/:id', () => {
        it('should return a form by id', async () => {
            const res = await request(app)
                .get(`/api/forms/${form._id}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('Test Form');
        });

        it('should return 404 if form not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/forms/${fakeId}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('Form not found');
        });
    });

    describe('POST /api/forms/:id/submit', () => {
        it('should submit a form response', async () => {
            const responses = { name: 'John Doe' };

            const res = await request(app)
                .post(`/api/forms/${form._id}/submit`)
                .send({ responses });

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Form submitted successfully');

            // Check if submission was saved
            const submission = await Submission.findOne({ form: form._id });
            expect(submission).toBeTruthy();
            expect(submission.responses.name).toBe('John Doe');
        });

        it('should return 400 if responses are missing', async () => {
            const res = await request(app)
                .post(`/api/forms/${form._id}/submit`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Responses are required');
        });
    });

    describe('GET /api/forms/:id/submissions', () => {
        it('should return submissions for a form', async () => {
            // Create a submission
            const submission = new Submission({
                form: form._id,
                responses: { name: 'Jane Doe' }
            });
            await submission.save();

            const res = await request(app)
                .get(`/api/forms/${form._id}/submissions`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].responses.name).toBe('Jane Doe');
        });
    });
});
