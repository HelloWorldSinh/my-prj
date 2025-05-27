const express = require('express');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can submit' });
    const { examId, answers, timeUsed } = req.body;
    try {
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        if (timeUsed === undefined || isNaN(timeUsed) || timeUsed < 0) {
            return res.status(400).json({ message: 'Invalid timeUsed value' });
        }

        let score = 0;
        for (const answer of answers) {
            const question = exam.questions.find(q => q._id.toString() === answer.questionId);
            if (question && question.answers[answer.selectedAnswer]?.isCorrect) {
                score += 1;
            }
        }
        const submission = new Submission({
            examId,
            studentId: req.user.id,
            answers,
            score,
            timeUsed,
        });
        await submission.save();
        res.status(201).json({ score, total: exam.questions.length });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get('/:examId', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can view submissions' });
    try {
        const submission = await Submission.findOne({ examId: req.params.examId, studentId: req.user.id });
        if (!submission) return res.status(404).json({ message: 'Submission not found' });
        const exam = await Exam.findById(req.params.examId).populate('questions');
        res.json({ submission, exam });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// New route to get all submissions for a student
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can view submissions' });
    try {
        const submissions = await Submission.find({ studentId: req.user.id })
            .populate({
                path: 'examId',
                select: 'title questions',
            });
        const submissionList = submissions.map(sub => ({
            examId: sub.examId._id,
            examTitle: sub.examId.title,
            score: sub.score,
            totalQuestions: sub.examId.questions.length,
            timeUsed: sub.timeUsed,
            submittedAt: sub.submittedAt,
        }));
        res.json(submissionList);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;