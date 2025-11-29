import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpload() {
    console.log('=== Testing File Upload Endpoint ===\n');

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(testFilePath));

        console.log('Uploading test file to http://localhost:5000/api/upload...');

        const response = await fetch('http://localhost:5000/api/upload', {
            method: 'POST',
            body: formData,
        });

        console.log('Response Status:', response.status, response.statusText);

        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Upload successful!');
            console.log('File URL:', data.url);
        } else {
            console.log('\n❌ Upload failed');
            console.log('Error:', data.message || data.error);
        }

    } catch (error) {
        console.error('\n❌ Request failed:', error.message);
    } finally {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    }
}

testUpload();
