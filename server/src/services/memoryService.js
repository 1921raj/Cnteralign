import { generateEmbedding } from './geminiService.js';
import { queryVectors } from './pineconeService.js';

export const getRelevantForms = async (userId, prompt) => {
    try {
        console.log(`Retrieving memory for prompt: "${prompt}"`);

        // 1. Generate embedding for the prompt
        const embedding = await generateEmbedding(prompt);

        // 2. Query Pinecone for similar forms
        // We filter by userId to ensure users only see their own relevant history
        const matches = await queryVectors(embedding, 5, userId);

        if (!matches || matches.length === 0) {
            console.log("No relevant memory found.");
            return [];
        }

        console.log(`Found ${matches.length} relevant forms from memory.`);

        // 3. Extract relevant info from metadata
        return matches.map(match => {
            let fields = [];
            try {
                // Handle potential stringified fields or array
                fields = typeof match.metadata.fields === 'string'
                    ? JSON.parse(match.metadata.fields)
                    : match.metadata.fields || [];
            } catch (e) {
                console.warn("Error parsing fields metadata:", e);
            }

            return {
                purpose: match.metadata.purpose,
                fields: fields,
                score: match.score
            };
        });

    } catch (error) {
        console.error("Memory Retrieval Error:", error);
        // Fail gracefully - return empty context so generation can still proceed
        return [];
    }
};
