import mongoose from 'mongoose';

const formSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    purpose: {
        type: String, // The original prompt or purpose
        required: true,
    },
    schema: {
        type: Object, // The generated JSON schema
        required: true,
    },
    keywords: {
        type: [String], // Extracted keywords for search/retrieval
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for text search on purpose and keywords
formSchema.index({ purpose: 'text', keywords: 'text' });

const Form = mongoose.model('Form', formSchema);

export default Form;
