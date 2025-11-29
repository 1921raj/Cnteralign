import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();

let pinecone;

const initPinecone = async () => {
    if (!pinecone) {
        pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
    }
    return pinecone;
};

export const upsertVector = async (id, values, metadata) => {
    try {
        const pc = await initPinecone();
        const index = pc.index(process.env.PINECONE_INDEX);

        await index.upsert([{
            id: id.toString(),
            values: values,
            metadata: metadata
        }]);
        console.log(`Vector upserted for form ${id}`);
    } catch (error) {
        console.error("Pinecone Upsert Error:", error);
        // Don't throw, just log, so main flow doesn't break if Pinecone fails
    }
};

export const queryVectors = async (vector, topK = 5, userId) => {
    try {
        const pc = await initPinecone();
        const index = pc.index(process.env.PINECONE_INDEX);

        // Ensure userId is a string for filtering
        const filter = userId ? { userId: userId.toString() } : {};

        const queryResponse = await index.query({
            vector: vector,
            topK: topK,
            includeMetadata: true,
            filter: filter
        });

        return queryResponse.matches;
    } catch (error) {
        console.error("Pinecone Query Error:", error);
        return [];
    }
};
