import Form from '../models/Form.js';

// Simple keyword extraction (mock implementation for now)
// In a real app, use an LLM or NLP library to extract keywords
const extractKeywords = (text) => {
    const stopWords = ['i', 'need', 'a', 'an', 'form', 'with', 'and', 'for', 'the', 'of', 'in', 'on', 'at', 'to'];
    return text.toLowerCase().split(' ')
        .filter(word => !stopWords.includes(word) && word.length > 2);
};

export const getRelevantForms = async (userId, prompt) => {
    try {
        const keywords = extractKeywords(prompt);

        // Find forms that match keywords in purpose or keywords field
        // Using MongoDB text search or regex
        // Since we added a text index, we can use $text search if we had full text search enabled
        // For now, let's use a simple regex on purpose

        const regexQueries = keywords.map(kw => ({ purpose: { $regex: kw, $options: 'i' } }));

        if (regexQueries.length === 0) return [];

        const forms = await Form.find({
            user: userId,
            $or: regexQueries
        })
            .select('purpose schema.fields') // Select only necessary fields for context
            .limit(5) // Top-K (5)
            .sort({ createdAt: -1 });

        return forms.map(f => ({
            purpose: f.purpose,
            fields: f.schema.fields.map(field => field.name) // Simplify schema for context
        }));
    } catch (error) {
        console.error("Memory Retrieval Error:", error);
        return [];
    }
};
