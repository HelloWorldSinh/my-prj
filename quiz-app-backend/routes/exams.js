const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const router = express.Router();

// Kiểm tra và tạo thư mục uploads nếu chưa tồn tại
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

router.post('/create', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can create exams' });
    const { title, startTime, endTime } = req.body;
    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const exam = new Exam({
            code,
            title,
            teacherId: req.user.id,
            startTime,
            endTime
        });
        await exam.save();
        res.status(201).json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch('/:examId', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can update exams' });
    const { shuffleQuestions, shuffleAnswers } = req.body;
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        exam.shuffleQuestions = shuffleQuestions || false;
        exam.shuffleAnswers = shuffleAnswers || false;
        await exam.save();
        res.json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/questions', auth, upload.single('media'), async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can add questions' });
    const { examId, content, answers } = req.body;
    try {
        const question = new Question({
            examId,
            content,
            media: req.file ? `/uploads/${req.file.filename}` : null,
            answers: JSON.parse(answers),
        });
        await question.save();
        await Exam.findByIdAndUpdate(examId, { $push: { questions: question._id } });
        res.status(201).json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/teacher', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can view their exams' });
    try {
        const exams = await Exam.find({ teacherId: req.user.id }).select('code title startTime endTime');
        res.json(exams);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/:code', auth, async (req, res) => {
    try {
        const exam = await Exam.findOne({ code: req.params.code }).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:examId', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can delete exams' });
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Xóa tất cả câu hỏi liên quan đến bài thi
        await Question.deleteMany({ examId: req.params.examId });
        // Xóa bài thi
        await Exam.findByIdAndDelete(req.params.examId);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;