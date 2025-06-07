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
    const { title, startTime, endTime, duration } = req.body;
    try {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) {
            return res.status(400).json({ message: 'End time must be after start time' });
        }
        if (!duration || isNaN(duration) || duration <= 0 || !Number.isInteger(Number(duration))) {
            return res.status(400).json({ message: 'Duration must be a positive integer (in minutes)' });
        }
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const exam = new Exam({
            code,
            title,
            teacherId: req.user.id,
            startTime,
            endTime,
            duration,
        });
        await exam.save();
        res.status(201).json(exam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch('/:examId', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can update exams' });
    const { shuffleQuestions, shuffleAnswers, title, startTime, endTime, duration } = req.body;
    try {
        const exam = await Exam.findById(req.params.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        exam.title = title || exam.title;
        exam.startTime = startTime ? new Date(startTime) : exam.startTime;
        exam.endTime = endTime ? new Date(endTime) : exam.endTime;
        exam.duration = duration || exam.duration;
        exam.shuffleQuestions = shuffleQuestions !== undefined ? shuffleQuestions : exam.shuffleQuestions;
        exam.shuffleAnswers = shuffleAnswers !== undefined ? shuffleAnswers : exam.shuffleAnswers;
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
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

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

router.patch('/questions/:questionId', auth, upload.single('media'), async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can update questions' });
    const { content, answers } = req.body;
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        const exam = await Exam.findById(question.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        question.content = content || question.content;
        question.answers = answers ? JSON.parse(answers) : question.answers;
        if (req.file) {
            if (question.media) {
                fs.unlinkSync(path.join(__dirname, '..', question.media)); // Xóa media cũ
            }
            question.media = `/uploads/${req.file.filename}`;
        }
        await question.save();
        res.json(question);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/questions/:questionId', auth, async (req, res) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Only teachers can delete questions' });
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });
        const exam = await Exam.findById(question.examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        if (exam.teacherId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        if (question.media) {
            fs.unlinkSync(path.join(__dirname, '..', question.media)); // Xóa file media
        }
        await Question.findByIdAndDelete(req.params.questionId);
        await Exam.findByIdAndUpdate(question.examId, { $pull: { questions: req.params.questionId } });
        res.json({ message: 'Question deleted successfully' });
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

router.get('/id/:examId', auth, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
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
        const questions = await Question.find({ examId: req.params.examId });
        for (const question of questions) {
            if (question.media) {
                fs.unlinkSync(path.join(__dirname, '..', question.media));
            }
        }
        await Question.deleteMany({ examId: req.params.examId });
        // Xóa bài thi
        await Exam.findByIdAndDelete(req.params.examId);
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;