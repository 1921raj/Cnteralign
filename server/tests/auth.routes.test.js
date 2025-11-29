import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import authRoutes from '../src/routes/auth.routes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
    beforeEach(async () => {
        // Clear users before each test
        await User.deleteMany({});
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('User registered successfully');
            expect(res.body).toHaveProperty('token');

            // Check if user was saved
            const user = await User.findOne({ email: userData.email });
            expect(user).toBeTruthy();
            expect(user.name).toBe(userData.name);
        });

        it('should return 400 if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            // Create user first
            await request(app)
                .post('/api/auth/register')
                .send(userData);

            // Try to register again
            const res = await request(app)
                .post('/api/auth/register')
                .send(userData);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('User already exists');
        });

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test User' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Please provide all fields');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a test user
            const hashedPassword = await bcrypt.hash('password123', 10);
            const user = new User({
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword
            });
            await user.save();
        });

        it('should login a user with correct credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Login successful');
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 for invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const res = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });

        it('should return 400 if fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Please provide email and password');
        });
    });
});
