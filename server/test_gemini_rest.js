import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiREST() {
    console.log('=== Testing Gemini API via REST ===');
    console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING');

    if (!API_KEY) {
        console.error('❌ No API key found!');
        return;
    }

    // Try the REST API directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: 'Say "Hello, API is working!" in JSON format with a message field.'
            }]
        }]
    };

    try {
        console.log('Sending REST request to Gemini API...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response Status:', response.status, response.statusText);

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ API Error:', data);
            if (data.error) {
                console.error('Error Details:', data.error.message);
                console.error('Error Code:', data.error.code);
            }
            return;
        }

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.candidates && data.candidates[0]) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('\nGenerated Text:', text);
        }

    } catch (error) {
        console.error('❌ Request failed:', error.message);
    }
}

testGeminiREST();
