const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    shuffleQuestions: { type: Boolean, default: false },
    shuffleAnswers: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    duration: { type: Number, required: true }, // Thời gian làm bài (phút)
});

module.exports = mongoose.model('Exam', examSchema);