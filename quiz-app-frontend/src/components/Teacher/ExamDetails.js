import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../CSS/ExamDetails.css";
import { FaArrowLeft, FaSearch, FaCalendarAlt, FaUser, FaClock, FaFileAlt, FaUsers } from "react-icons/fa";


const ExamDetails = () => {
    const { examId } = useParams();
    const [exam, setExam] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();


    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                // Fetch exam details
                const examRes = await axios.get(
                    `http://localhost:5000/api/exams/id/${examId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setExam(examRes.data);


                // Fetch submissions for this exam
                const submissionsRes = await axios.get(
                    `http://localhost:5000/api/submissions/exam/${examId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                setSubmissions(submissionsRes.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || "Error fetching exam details");
                setLoading(false);
            }
        };


        fetchExamDetails();
    }, [examId]);


    const handleDeleteSubmission = async (submissionId) => {
        if (!window.confirm("Are you sure you want to delete this submission?"))
            return;


        try {
            await axios.delete(
                `http://localhost:5000/api/submissions/${submissionId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            setSubmissions(submissions.filter((sub) => sub._id !== submissionId));
        } catch (err) {
            setError(err.response?.data?.message || "Error deleting submission");
        }
    };


    const handleViewDetails = (submissionId) => {
        console.log(
            "Navigating to result with examId:",
            examId,
            "submissionId:",
            submissionId
        );
        navigate(`/result/${examId}/${submissionId}`);
    };
    const handleBack = () => {
        navigate('/exam-list');
    };

    const getScoreClass = (score, total) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'score-high';
        if (percentage >= 50) return 'score-medium';
        return 'score-low';
    };

    const filteredSubmissions = submissions.filter(sub => 
        sub.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="exam-details-container">
            <div className="no-submissions">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải dữ liệu...</p>
            </div>
        </div>
    );
    
    if (error) return (
        <div className="exam-details-container">
            <div className="no-submissions">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Lỗi: {error}</p>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại danh sách đề thi
                </button>
            </div>
        </div>
    );


    return (
        <div className="exam-details-container">
            <div className="exam-details-header">
                <h1 className="exam-details-title">Chi tiết bài kiểm tra</h1>
                <button className="back-button" onClick={handleBack}>
                    <FaArrowLeft /> Quay lại danh sách đề thi
                </button>
            </div>

            {exam && (
                <div className="exam-info">
                    <div className="info-card primary">
                        <h4>Tên bài kiểm tra</h4>
                        <p>{exam.title}</p>
                    </div>
                    <div className="info-card">
                        <h4>Mã bài kiểm tra</h4>
                        <p>{exam.code}</p>
                    </div>
                    <div className="info-card">
                        <h4>Số câu hỏi</h4>
                        <p>{exam.questions.length}</p>
                    </div>
                    <div className="info-card">
                        <h4>Số lượt làm bài</h4>
                        <p>{submissions.length}</p>
                    </div>
                </div>
            )}

            <div className="submissions-section">
                <div className="submissions-search-bar">
                    <div className="search-input-container">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo email học viên..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="search-icon" />
                    </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                    <div className="no-submissions">
                        <i className="fas fa-clipboard-list"></i>
                        <p>{searchTerm ? 'Không tìm thấy bài nộp phù hợp.' : 'Chưa có bài nộp nào cho đề thi này.'}</p>
                    </div>
                ) : (
                    <table className="submissions-table">
                        <thead>
                            <tr>
                                <th>Email học viên</th>
                                <th>Điểm số</th>
                                <th>Thời gian làm</th>
                                <th>Bắt đầu</th>
                                <th>Nộp bài</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubmissions.map((submission) => {
                                const startTime = new Date(
                                    new Date(submission.submittedAt).getTime() -
                                    submission.timeUsed * 1000
                                );
                                const correctAnswers = submission.answers.reduce(
                                    (count, answer) => {
                                        const question = exam.questions.find(
                                            (q) => q._id.toString() === answer.questionId.toString()
                                        );
                                        if (
                                            question &&
                                            question.answers[answer.selectedAnswer]?.isCorrect
                                        ) {
                                            return count + 1;
                                        }
                                        return count;
                                    },
                                    0
                                );
                                
                                const minutes = Math.floor(submission.timeUsed / 60);
                                const seconds = submission.timeUsed % 60;
                                const timeUsedStr = `${minutes} phút ${seconds} giây`;
                                const scoreClass = getScoreClass(correctAnswers, exam.questions.length);                            return (
                                <tr key={submission._id}>
                                    <td>{submission.studentId.email}</td>
                                    <td>
                                        <div className="score-cell">
                                            <span className={`score-badge ${scoreClass}`}>
                                                {correctAnswers}/{exam.questions.length}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{timeUsedStr}</td>
                                    <td>{startTime.toLocaleString('vi-VN')}</td>
                                    <td>{new Date(submission.submittedAt).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <button
                                            onClick={() => handleViewDetails(submission._id)}
                                            className="action-button details"
                                        >
                                            Xem chi tiết
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSubmission(submission._id)}
                                            className="action-button delete"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                )}
            </div>
        </div>
    );
};


export default ExamDetails;
