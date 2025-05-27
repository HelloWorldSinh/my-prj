const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [
        {
            questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
            selectedAnswer: { type: Number },
        },
    ],
    score: { type: Number },
    submittedAt: { type: Date, default: Date.now },
    timeUsed: { type: Number }, // Thời gian làm bài (giây)
});

module.exports = mongoose.model('Submission', submissionSchema);