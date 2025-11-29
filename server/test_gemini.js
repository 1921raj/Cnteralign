import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
    console.log('=== Gemini API Test ===');
    console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'MISSING');
    console.log('API Key Length:', API_KEY?.length);

    if (!API_KEY) {
        console.error('❌ No API key found!');
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Try different model names
    const modelsToTry = [
        'gemini-pro',
        'gemini-1.5-pro',
        'models/gemini-pro',
        'models/gemini-1.5-pro'
    ];

    for (const modelName of modelsToTry) {
        try {
            console.log(`\n--- Testing model: ${modelName} ---`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = 'Generate a JSON object with title "Contact Form" and description "A simple contact form"';

            console.log('Sending request...');
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log('✅ SUCCESS with model:', modelName);
            console.log('Response:', text.substring(0, 200));

            // If successful, update the .env recommendation
            console.log(`\n✅ Use this model in your code: "${modelName}"`);
            return;

        } catch (error) {
            console.log(`❌ Failed with ${modelName}:`, error.message);
            if (error.status) console.log('   Status:', error.status);
        }
    }

    console.log('\n❌ All models failed. Check your API key at: https://makersuite.google.com/app/apikey');
}

testGemini();
