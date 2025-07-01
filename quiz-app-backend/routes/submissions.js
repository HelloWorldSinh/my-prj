const express = require('express');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const auth = require('../middleware/auth');
const router = express.Router();

router.get("/exam/:examId", auth, async (req, res) => {
    try {
        const submissions = await Submission.find({ examId: req.params.examId })
            .populate("studentId", "email name")
            .populate("examId", "title questions")
            .lean();
        
        // Luôn trả về dữ liệu, kể cả khi là mảng rỗng
        res.json(submissions);
    }   catch (error) {
        console.error("Error fetching submissions for exam:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// API để học sinh bắt đầu làm bài
router.post('/start', auth, async (req, res) => {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Only students can start an exam' });
    const { examId } = req.body;
    try {
        const existingSubmission = await Submission.findOne({ examId, studentId: req.user.id });
        if (existingSubmission) {
            return res.status(200).json(existingSubmission);
        }

        const submission = new Submission({ examId, studentId: req.user.id });
        await submission.save();

        const submissionWithStudent = await Submission.findById(submission._id).populate('studentId', 'email name');
        req.io.to(examId).emit('student_started', submissionWithStudent);

        res.status(201).json(submission);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API để cập nhật câu trả lời
router.patch('/update-answer', auth, async (req, res) => {
    const { submissionId, questionId, selectedAnswer } = req.body;
    try {
        const submission = await Submission.findById(submissionId);
        if (!submission || submission.studentId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        const answerIndex = submission.answers.findIndex(a => a.questionId.toString() === questionId);
        if (answerIndex > -1) {
            submission.answers[answerIndex].selectedAnswer = selectedAnswer;
        } else {
            submission.answers.push({ questionId, selectedAnswer });
        }
        await submission.save();

        req.io.to(submission.examId.toString()).emit('progress_updated', {
            submissionId: submission._id,
            answers: submission.answers
        });

        res.status(200).json({ message: 'Answer updated' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API báo cáo vi phạm
router.patch('/report-violation/:submissionId', auth, async (req, res) => {
    try {
        const submission = await Submission.findByIdAndUpdate(req.params.submissionId, { $inc: { violationCount: 1 } }, { new: true });
        if (!submission) return res.status(404).json({ message: 'Submission not found' });
        
        req.io.to(submission.examId.toString()).emit('violation_updated', {
            submissionId: submission._id,
            violationCount: submission.violationCount
        });

        res.status(200).json({ newCount: submission.violationCount });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API nộp bài (sửa đổi)
router.post('/submit', auth, async (req, res) => {
    const { submissionId, answers, timeUsed } = req.body;
    try {
        const submission = await Submission.findById(submissionId);
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        const exam = await Exam.findById(submission.examId).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        let score = 0;
        for (const answer of answers) {
            const question = exam.questions.find(q => q._id.toString() === answer.questionId);
            if (question && question.answers[answer.selectedAnswer]?.isCorrect) score += 1;
        }

        submission.answers = answers;
        submission.score = score;
        submission.timeUsed = timeUsed;
        submission.status = 'submitted';
        submission.submittedAt = new Date();
        await submission.save();

        req.io.to(submission.examId.toString()).emit('submission_finished', {
            submissionId: submission._id,
            status: 'submitted',
            score: submission.score
        });

        res.status(201).json({ score, total: exam.questions.length });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Giữ lại API để giáo viên lấy danh sách ban đầu
router.get("/exam/:examId", auth, async (req, res) => {
    try {
        const submissions = await Submission.find({ examId: req.params.examId })
            .populate("studentId", "email name")
            .populate("examId", "questions")
            .lean();
        res.json(submissions);
    } catch (error) {
        console.error("Error fetching submissions for exam:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// API để học sinh kiểm tra mã đề thi trước khi vào làm
router.get("/check-submission/:examCode", auth, async (req, res) => {
    if (req.user.role !== "student") {
        return res.status(403).json({ message: "Only students can check submissions" });
    }
    try {
        // Dùng toUpperCase() để đảm bảo tìm kiếm chính xác
        const exam = await Exam.findOne({ code: req.params.examCode.toUpperCase() });

        if (!exam) {
            // Trả về lỗi 404 nếu không tìm thấy bài thi
            return res.status(404).json({ message: "Không tìm thấy bài thi với mã này" });
        }

        // Kiểm tra xem học sinh đã nộp bài cho kỳ thi này chưa
        const existingSubmission = await Submission.findOne({
            examId: exam._id,
            studentId: req.user.id,
        });

        res.json({ 
            examId: exam._id, // Trả về cả examId để frontend có thể dùng
            hasSubmitted: !!existingSubmission 
        });
        
    } catch (error) {
        console.error("Error in check-submission:", error);
        res.status(500).json({ message: "Error checking submission" });
    }
});

// API cho học sinh xem danh sách các bài kiểm tra đã làm
router.get('/', auth, async (req, res) => {
if (req.user.role !== 'student') {
return res.status(403).json({ message: 'Only students can access their submissions' });
 }

 try {
 let submissions = await Submission.find({ studentId: req.user.id })
 .populate('examId', 'title') // chỉ lấy title từ bài kiểm tra
 .lean();

 // Thêm trường examTitle để frontend dễ dùng
 submissions = submissions.map(sub => ({
 ...sub,
 examTitle: sub.examId?.title || 'Không có tiêu đề'
 }));

 res.json(submissions);
 } catch (error) {
 console.error("Error fetching student submissions:", error);
 res.status(500).json({ message: "Internal server error" });
 }
});

// API để lấy chi tiết một bài nộp (dành cho cả học sinh và giáo viên)
router.get('/:examId/:submissionId', auth, async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.submissionId).populate('examId');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

       
        // Cho phép truy cập nếu:
        // 1. Người dùng là học sinh sở hữu bài nộp NÀY.
        // 2. Người dùng là giáo viên sở hữu bài thi của bài nộp này.
        const isOwnerStudent = submission.studentId.toString() === req.user.id;
        const isOwnerTeacher = submission.examId.teacherId.toString() === req.user.id;

        if (isOwnerStudent || isOwnerTeacher) {
            // Nếu có quyền, populate thêm dữ liệu chi tiết và trả về
            await submission.populate({
                path: 'examId',
                populate: { path: 'questions' }
            });
            // Trả về cả submission và exam để trang Result có đủ dữ liệu
            return res.json({ submission, exam: submission.examId });
        }

        // Nếu không có quyền, từ chối
        return res.status(403).json({ message: 'Forbidden: You do not have permission to view this submission.' });

    } catch (error) {
        console.error("Error fetching single submission:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;