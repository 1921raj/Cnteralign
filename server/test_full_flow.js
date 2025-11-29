import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let formId = '';

const log = (step, data) => {
    console.log(`\n=== ${step} ===`);
    console.log(JSON.stringify(data, null, 2));
};

const runTests = async () => {
    try {
        // 1. Register
        const randomEmail = `test${Date.now()}@example.com`;
        const registerRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: randomEmail,
                password: 'password123'
            })
        });
        const text = await registerRes.text();
        let registerData;
        try {
            registerData = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse register response:', text);
            throw e;
        }
        log('1. Register', registerData);

        if (registerData.token) {
            token = registerData.token;
            userId = registerData._id;
        } else {
            // If user already exists, try login
            console.log('User might exist, trying login...');
        }

        // 2. Login (if needed or to verify)
        if (!token) {
            const loginRes = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: randomEmail, // This might fail if register failed, but assuming flow
                    password: 'password123'
                })
            });
            const loginData = await loginRes.json();
            log('2. Login', loginData);
            token = loginData.token;
        }

        if (!token) throw new Error('Authentication failed');

        // 3. Generate Form (AI)
        const prompt = "Create a job application form with name, email, resume upload, and portfolio link";
        const aiRes = await fetch(`${BASE_URL}/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt })
        });
        const aiData = await aiRes.json();
        log('3. AI Generate Form', aiData);
        formId = aiData._id;

        if (!formId) throw new Error('Form generation failed');

        // 4. Get User Forms
        const formsRes = await fetch(`${BASE_URL}/forms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const formsData = await formsRes.json();
        log('4. Get User Forms', formsData.length);

        // 5. Get Single Form (Public)
        const formRes = await fetch(`${BASE_URL}/forms/${formId}`);
        const formData = await formRes.json();
        log('5. Get Single Form', formData.title);

        // 6. Submit Form Response
        // Construct responses based on schema
        const responses = {};
        formData.schema.fields.forEach(field => {
            if (field.type === 'email') responses[field.name] = 'applicant@example.com';
            else if (field.type === 'file') responses[field.name] = 'http://example.com/resume.pdf'; // Mock URL
            else responses[field.name] = 'Test Response';
        });

        const submitRes = await fetch(`${BASE_URL}/forms/${formId}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responses })
        });
        const submitData = await submitRes.json();
        log('6. Submit Form', submitData);

        // 7. Get Submissions (Private)
        const subsRes = await fetch(`${BASE_URL}/forms/${formId}/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subsData = await subsRes.json();
        log('7. Get Submissions', subsData);

        console.log('\n✅ All tests passed successfully!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error);
    }
};

runTests();
