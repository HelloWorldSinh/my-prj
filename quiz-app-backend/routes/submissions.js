const express = require('express');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const router = express.Router();
const mongoose = require("mongoose");

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
        res.status(201).json({
            score,
            total: exam.questions.length,
            submissionId: submission._id
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/check-submission/:examCode", auth, async (req, res) => {
    if (req.user.role !== "student")
        return res
            .status(403)
            .json({ message: "Only students can check submissions" });
    try {
        const exam = await Exam.findOne({
            code: { $regex: `^${req.params.examCode}$`, $options: "i" },
        });
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        const existingSubmission = await Submission.findOne({
            examId: exam._id,
            studentId: req.user.id,
        });

        res.json({ hasSubmitted: !!existingSubmission });
    } catch (error) {
        console.error(error); // Log lỗi để debug
        res.status(500).json({ message: "Error checking submission", error: error.message });
    }
});

router.get('/:examId', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can view submission' });
    try {
        const submission = await Submission.findOne({ examId: req.params.examId, studentId: req.user.id });
        if (!submission) return res.status(404).json({ message: 'Submission not found' });
        const exam = await Exam.findById(req.params.examId).populate('questions');
        res.json({ submission, exam });
    } catch (error) {
        console.log("1");
        res.status(400).json({ message: error.message });
    }
});

// New route to get all submissions for a student
router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can view submission' });
    try {
        const submissions = await Submission.find({ studentId: req.user.id })
            .populate({
                path: 'examId',
                select: 'title questions',
            });
        const submissionList = submissions.map(sub => ({
            _id: sub._id, // Thêm _id của submission
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

router.get("/exam/:examId", auth, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        if (!req.params.examId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid exam ID format" });
        }
        const submissions = await Submission.find({ examId: req.params.examId })
            .populate("studentId", "email") // Populate studentId with email field
            .populate("examId", "title") // Optional: populate examId
            .lean();
        if (!submissions || submissions.length === 0) {
            return res
                .status(404)
                .json({ message: "No submissions found for this exam" });
        }
        res.json(submissions);
    } catch (error) {
        console.error("Error fetching submissions for exam:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
});

//endpoint để lấy submission từ giáo viên để xem details
router.get('/:examId/:submissionId', auth, async (req, res) => {
    try {
        const submission = await Submission.findOne({
            _id: req.params.submissionId,
            examId: req.params.examId
        });
        if (!submission) return res.status(404).json({ message: 'Submission not found' });
        const exam = await Exam.findById(req.params.examId).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json({ submission, exam });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;