const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
            selectedAnswer: { type: Number },
            _id: false
        },
    ],
    score: { type: Number },
    status: {
        type: String,
        enum: ['in_progress', 'submitted'],
        default: 'in_progress'
    },
    violationCount: {
        type: Number,
        default: 0
    },
    submittedAt: { type: Date },
    timeUsed: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

submissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);