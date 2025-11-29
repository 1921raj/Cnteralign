import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Form',
        required: true,
    },
    responses: {
        type: Object, // Key-value pairs of field name and value
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
