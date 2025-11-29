import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from "dotenv";
dotenv.config();



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Mock form generator as fallback
const generateMockForm = (prompt) => {
    const keywords = prompt.toLowerCase();
    const fields = [];

    // Basic field detection
    if (keywords.includes('name')) {
        fields.push({ name: 'name', label: 'Full Name', type: 'text', required: true });
    }
    if (keywords.includes('email')) {
        fields.push({ name: 'email', label: 'Email Address', type: 'email', required: true });
    }
    if (keywords.includes('phone') || keywords.includes('contact')) {
        fields.push({ name: 'phone', label: 'Phone Number', type: 'tel', required: false });
    }
    if (keywords.includes('address')) {
        fields.push({ name: 'address', label: 'Address', type: 'textarea', required: false });
    }
    if (keywords.includes('message') || keywords.includes('comment') || keywords.includes('feedback')) {
        fields.push({ name: 'message', label: 'Message', type: 'textarea', required: false });
    }

    // File upload detection - multiple variations
    if (keywords.includes('resume') || keywords.includes('cv')) {
        fields.push({ name: 'resume', label: 'Upload Resume/CV', type: 'file', required: false });
    }
    if (keywords.includes('photo') || keywords.includes('image') || keywords.includes('picture')) {
        fields.push({ name: 'photo', label: 'Upload Photo', type: 'file', required: false });
    }
    if (keywords.includes('document') || keywords.includes('attachment')) {
        fields.push({ name: 'document', label: 'Upload Document', type: 'file', required: false });
    }
    if (keywords.includes('file') && !keywords.includes('resume') && !keywords.includes('photo') && !keywords.includes('document')) {
        fields.push({ name: 'file', label: 'Upload File', type: 'file', required: false });
    }

    // Default fields if none detected
    if (fields.length === 0) {
        fields.push(
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'email', required: true },
            { name: 'file', label: 'Upload File (Optional)', type: 'file', required: false }
        );
    }

    return {
        title: prompt.charAt(0).toUpperCase() + prompt.slice(1),
        description: `Generated form for: ${prompt}`,
        fields
    };
};

export const generateFormSchema = async (prompt, context = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let contextString = "";
        if (context.length > 0) {
            contextString = `
Here is relevant user form history for reference:
${JSON.stringify(context, null, 2)}
`;
        }

        const fullPrompt = `
You are an intelligent form schema generator.

${contextString}

Now generate a new form schema for this request:
"${prompt}"

Return ONLY the JSON schema. The schema should have a 'title', 'description', and a 'fields' array.
Each field should have 'name', 'label', 'type' (text, email, number, file, etc.), 'required' (boolean), and 'options' (if applicable).
Do not include markdown formatting like \`\`\`json. Just the raw JSON.
`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Clean up if markdown is present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Gemini Generation Error:", error.message);
        console.warn("⚠️  Falling back to mock generation. Please check your GEMINI_API_KEY.");

        // Fallback to mock generation
        return generateMockForm(prompt);
    }
};
